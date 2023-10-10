import LLMPrompts from "./llmprompts";
import Types from "./types";
import Utils from "./utils";

class AIDapter {

  private utils = new Utils();

  // ---------------------------------------------------------------
  private llm: Types.LLMModelConfig = {
    "provider": "OpenAI",
    "model_name": "gpt-3.5-turbo-16k",
    "endpoint": "https://api.openai.com/v1/chat/completions",
    "authentication": {
      "api_key": "",
      "org_id": ""
    }
  };

  /**
   * Create a new AI-Dapter object with specific model configuration.
   * @param llmConfig Model parameters such as model name, endpoint, authenticationm etc.
   */
  constructor(llmConfig: Types.LLMModelConfig) {
    this.llm.provider = llmConfig.provider || this.llm.provider;
    this.llm.model_name = llmConfig.model_name || this.llm.model_name;
    this.llm.endpoint = llmConfig.endpoint || this.llm.endpoint;
    this.llm.authentication.api_key = llmConfig.authentication.api_key || this.llm.authentication.api_key;
    this.llm.authentication.org_id = llmConfig.authentication.org_id || this.llm.authentication.org_id;
  };

  /**
   * Based on the user question, retrieve revelant API endpoints which can be used to obtain realtime data.
   * @param input User question
   * @param apiRepository Provide complete API repository which would contain details about API endpoint (method, url, headers, and data), placeholders used in the API endpoint along with validation instructions which LLM will use.
   * @returns Array of relevant API sources populated with placeholder values.
   */
  getRealtimeSources(input: string, apiRepository: Array<Types.APIRepository>) {
    return new Promise(async (resolve, reject) => {
      let llmPrompts = new LLMPrompts();
      let prompt = llmPrompts.forRealtimeSources(input, apiRepository);
      let resp: any = {};
      switch (this.llm.provider) {
        case "OpenAI":
          resp = await this.utils.callOpenAI(this.llm, prompt);
          break;

        default:
          break;
      };
      let llmResponse = resp.data.choices[0].message.content;
      let payload = JSON.parse(llmResponse.substring(llmResponse.indexOf('{'), llmResponse.lastIndexOf('}') + 1)); // only select JSON object
      if (!payload['api_endpoints'])
        payload['api_endpoints'] = [];
      payload['tokens'] = resp.data.usage;
      this.utils.log("I", payload.api_endpoints.length + " APIs identified");
      resolve(payload);
    });
  };

  /**
   * Based on the user question, retrieve realtime data from revelant API endpoints.
   * @param input User question
   * @param apiRepository Provide complete API repository which would contain details about API endpoint (method, url, headers, and data), placeholders used in the API endpoint along with validation instructions which LLM will use.
   * @param dataConfig Optional configuration parameters which can be used to control realtime data records, pass additional context to allow follow-ups, etc.
   * @returns Array of data records based on successful response from identified API endpoints.
   */
  getDataFromRealtimeSource(input: string, apiRepository: Array<Types.APIRepository>, dataConfig?: Types.DataConfig) {
    return new Promise((resolve, reject) => {
      let inprogress = true;
      let addContext: Array<any> = [];
      let entities: Array<any> = [];
      let question: Array<any> = [];
      if (dataConfig?.additional_context) {
        let maxContext = (dataConfig?.max_contexts && dataConfig?.max_contexts > 0) ? (dataConfig?.max_contexts > 2 ? 2 : dataConfig?.max_contexts) : 2;
        dataConfig?.additional_context.splice(0, dataConfig?.additional_context.length - maxContext); // Limit context results
        dataConfig?.additional_context.forEach((context: any, i) => {
          if (Object.keys(context).length > 0) {
            if (context.original_question)
              question.push(context.original_question);
            if (context.response_summary)
              addContext.push(context.response_summary);
            if (context.entities)
              entities.push(context.entities);
          }
          this.utils.log("I", "Additional Context (" + (i + 1) + "):", context);
        });
      }
      question.push(input);
      let updatedInput = (addContext.length ? `\nAdditional context:\n` + addContext.join(". ") : ``) + `\n` + JSON.stringify(entities);
      updatedInput += `\nQuestion: ` + question.join(". ");
      this.utils.log("I", "Question for API", question.join(". "));
      this.getRealtimeSources(updatedInput, apiRepository)
        .then((payload: any) => {
          let apiResults: any = [];
          payload.api_endpoints.forEach((api_endpoint: any, i: number) => {
            if (api_endpoint['status']) {
              if (api_endpoint.status == "OK") {
                this.utils.callAPI(api_endpoint.api.method, api_endpoint.api.url, api_endpoint.api.headers, api_endpoint.api.data || false)
                  .then((resp: any) => {
                    this.utils.log("I", "[" + resp.status + "] " + api_endpoint.api.url);
                    let maxRecords = (dataConfig?.max_records && dataConfig?.max_records > 0) ? (dataConfig?.max_records > 10 ? 10 : dataConfig?.max_records) : 10;
                    let response = resp.data;
                    Object.keys(response).forEach((key) => {
                      if (Array.isArray(response[key])) {
                        response[key].splice(maxRecords);  // Limit data results
                      }
                    });
                    apiResults.push(response);
                    if (apiResults.length == payload.api_endpoints.length)
                      inprogress = false;
                  }).catch((err: any) => {
                    this.utils.log("E", api_endpoint.api.url, err);
                    reject({
                      "api_results": err,
                      "tokens": payload.tokens
                    });
                  });
              }
              else {
                this.utils.log("W", api_endpoint.api.url + " has missing placeholder values");
                let placeholdersUndetermined: any = [];
                if (api_endpoint['placeholders']) {
                  api_endpoint.placeholders.forEach((placeholder: any) => {
                    if (placeholder['placeholder']) {
                      if (!placeholder.determined)
                        placeholdersUndetermined.push(placeholder.placeholder);
                    }
                  });
                  this.utils.log("W", placeholdersUndetermined.length + " placeholders undetermined", placeholdersUndetermined.join(","));
                  if (placeholdersUndetermined.length) {
                    apiResults.push({ "missing_placeholder_values": placeholdersUndetermined.join(",") });
                    if (apiResults.length == payload.api_endpoints.length)
                      inprogress = false;
                  }
                }
                else {
                  this.utils.log("W", api_endpoint.api.url + " has no placeholders");
                  apiResults.push('-');
                  if (apiResults.length == payload.api_endpoints.length)
                    inprogress = false;
                }
              }
            }
            else {
              this.utils.log("W", api_endpoint.api.url + " has no status");
              apiResults.push('-');
              if (apiResults.length == payload.api_endpoints.length)
                inprogress = false;
            }
          });
          let timeout = (12 * payload.api_endpoints.length);
          let intvl = setInterval(() => {
            if (!inprogress || timeout <= 0) {
              clearInterval(intvl);
              resolve({
                "api_results": apiResults,
                "tokens": payload.tokens
              });
            }
            else
              timeout--;
          }, 500);
        }).catch((err: any) => {
          this.utils.log("E", "Getting realtime sources failed", err);
          reject({
            "api_results": err,
            "tokens": {
              "prompt_tokens": 0,
              "completion_tokens": 0,
              "total_tokens": 0
            }
          });
        });
    });
  };

  /**
   * Based on the user question, retrieve LLM's response grounded by realtime data obtained from revelant API endpoints.
   * @param input User question
   * @param apiRepository Provide complete API repository which would contain details about API endpoint (method, url, headers, and data), placeholders used in the API endpoint along with validation instructions which LLM will use.
   * @param options Optional configuration parameters to manage realtime data records and agent-specific configuration.
   * @returns LLM-generated response and additional context to aid follow-ups.
   */
  getLLMResponseFromRealtimeSources(input: string, apiRepository: Array<Types.APIRepository>, options?: Types.AIDapterOptions) {
    return new Promise((resolve, reject) => {
      this.getDataFromRealtimeSource(input, apiRepository, options?.dataConfig)
        .then(async (realtimeData: any) => {
          this.utils.log("I", "Got " + realtimeData.api_results.length + " results from API calls");
          if (realtimeData.api_results.length) {
            let question: Array<any> = [];
            if (options) {
              if (options.dataConfig?.additional_context) {
                let maxContext = (options.dataConfig?.max_contexts && options.dataConfig?.max_contexts > 0) ? (options.dataConfig?.max_contexts > 2 ? 2 : options.dataConfig?.max_contexts) : 2;
                options.dataConfig?.additional_context.splice(0, options.dataConfig?.additional_context.length - maxContext); // Limit context results
                options.dataConfig?.additional_context.forEach((context: any, i) => {
                  if (Object.keys(context).length > 0) {
                    if (context.original_question)
                      question.push(context.original_question);
                  }
                });
              }
            }
            question.push(input);
            this.utils.log("I", "Question for LLM", question.join(". "));
            let llmPrompts = new LLMPrompts();
            let prompt = llmPrompts.forResponseWithData(question.join(". "), realtimeData.api_results, options?.agentConfig);
            let resp: any = {};
            switch (this.llm.provider) {
              case "OpenAI":
                resp = await this.utils.callOpenAI(this.llm, prompt);
                break;

              default:
                break;
            };
            this.utils.log("I", "Generating response...");
            if (resp.status == 200) {
              this.utils.log("I", "Response OK");
              let payload = (resp.data.choices[0].message.content.indexOf('{') >= 0 && resp.data.choices[0].message.content.lastIndexOf('}') > 0) ?
                JSON.parse(resp.data.choices[0].message.content.substring(resp.data.choices[0].message.content.indexOf('{'), resp.data.choices[0].message.content.lastIndexOf('}') + 1))
                :
                {
                  "response": resp.data.choices[0].message.content,
                  "status": "OK",
                  "additional_context": {
                    "conversation": {
                      "original_question": input,
                      "response_summary": resp.data.choices[0].message.content.substring(0, 25)
                    },
                    "additional_context": {},
                    "entities": {}
                  },
                };
              resolve({
                "ai_response": payload.response,
                "ai_status": payload.status,
                "ai_context": payload.additional_context,
                "tokens": {
                  "api_identification": realtimeData.tokens,
                  "llm_response": resp.data.usage,
                  "prompt_tokens": realtimeData.tokens['prompt_tokens'] + resp.data.usage['prompt_tokens'],
                  "completion_tokens": realtimeData.tokens['completion_tokens'] + resp.data.usage['completion_tokens'],
                  "total_tokens": realtimeData.tokens['total_tokens'] + resp.data.usage['total_tokens']
                }
              });
            }
            else {
              this.utils.log("W", "Response NOT OK");
              let possibleResponses = [
                "I'm sorry, but the data I obtained seems to be invalid. Can you please double-check and rephrase your question?",
                "Unfortunately, it appears that the information I looked up isn't insufficient. Could you correct it or provide more details?",
                "The data obtained doesn't seem to be reliable. Can you rephrase your question with additional information?",
                "It looks like the I obtained to answer your query is incorrect. Could you please provide more information or clarify your question?",
                "I'm having trouble with the data I received. Can you check and provide additional information and rephrase your question for better results?"
              ]
              resolve({
                "ai_response": possibleResponses[Math.floor(Math.random() * possibleResponses.length)],
                "ai_status": "BAD-DATA",
                "ai_context": {
                  "conversation": {
                    "original_question": input,
                    "response_summary": possibleResponses[Math.floor(Math.random() * possibleResponses.length)]
                  },
                  "additional_context": {},
                  "entities": {}
                },
                "tokens": {
                  "api_identification": realtimeData.tokens,
                  "llm_response": resp.data.usage,
                  "prompt_tokens": realtimeData.tokens['prompt_tokens'] + resp.data.usage['prompt_tokens'],
                  "completion_tokens": realtimeData.tokens['completion_tokens'] + resp.data.usage['completion_tokens'],
                  "total_tokens": realtimeData.tokens['total_tokens'] + resp.data.usage['total_tokens']
                }
              });
            }
          }
          else {
            this.utils.log("W", "No APIs were identified");
            let possibleResponses = [
              "I'm sorry, but I couldn't find any information on that topic. Would you mind rephrasing your question and trying again?",
              "Unfortunately, I couldn't locate any sources relevant to your query. Could you please rephrase and ask again?",
              "I searched, but couldn't find any available sources for your question. Can you rephrase it to help me assist you better?",
              "It appears there are no sources available to answer your question. Could you rephrase it so I can try again?",
              "I couldn't locate a source to provide the information you're looking for. Could you please rephrase your question for better results?"
            ]
            resolve({
              "ai_response": possibleResponses[Math.floor(Math.random() * possibleResponses.length)],
              "ai_status": "NO-SOURCE",
              "ai_context": {
                "conversation": {
                  "original_question": input,
                  "response_summary": possibleResponses[Math.floor(Math.random() * possibleResponses.length)]
                },
                "additional_context": {},
                "entities": {}
              },
              "tokens": {
                "api_identification": realtimeData.tokens,
                "llm_response": {
                  "prompt_tokens": 0,
                  "completion_tokens": 0,
                  "total_tokens": 0
                },
                "prompt_tokens": realtimeData.tokens['prompt_tokens'],
                "completion_tokens": realtimeData.tokens['completion_tokens'],
                "total_tokens": realtimeData.tokens['total_tokens']
              }
            });
          }
        }).catch((err: any) => {
          this.utils.log("E", "Getting realtime data failed", err);
          reject(err);
        });
    });
  };

}; // class

export = AIDapter;