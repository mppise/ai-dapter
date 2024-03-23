import LLMPrompts from "./llmprompts";
import Types from "./types";
import Utils from "./utils";

class AIDapter {

  private utils = new Utils();

  // ---------------------------------------------------------------
  private llm: Types.LLMModelConfig = {
    "app_name": "",
    "provider": "OpenAI",
    "model_name": "",
    "endpoint": "",
    "authentication": {
      "api_key": "",
      "org_id": ""
    },
    "temperature": 0.8,
    "telemetry": true
  };

  /**
   * Create a new AI-Dapter object with specific model configuration.
   * @param llmConfig Model parameters such as model name, endpoint, authenticationm etc.
   */
  constructor(llmConfig: Types.LLMModelConfig) {
    this.llm.app_name = llmConfig.app_name || this.llm.app_name;
    this.llm.provider = llmConfig.provider || this.llm.provider;
    if (this.llm.provider == "OpenAI") {
      this.llm.model_name = llmConfig.model_name || "gpt-3.5-turbo-16k";
      this.llm.endpoint = llmConfig.endpoint || "https://api.openai.com/v1/chat/completions";
    }
    else if (this.llm.provider == "GoogleAI") {
      this.llm.model_name = llmConfig.model_name || "gemini-pro";
      this.llm.endpoint = llmConfig.endpoint || "https://generativelanguage.googleapis.com/v1/models/gemini-1.0-pro:generateContent";
    }
    // --
    //  .. add more providers here ...
    // -- 
    this.llm.authentication.api_key = llmConfig.authentication.api_key || this.llm.authentication.api_key;
    this.llm.authentication.org_id = llmConfig.authentication.org_id || this.llm.authentication.org_id;
    this.llm.temperature = llmConfig.temperature || this.llm.temperature;
    this.llm.telemetry = llmConfig.telemetry || this.llm.telemetry;
    this.utils.initializeTelemetry(this.llm.app_name, this.llm.telemetry == true);
  };

  /**
   * Based on the user question, retrieve revelant API endpoints which can be used to obtain realtime data.
   * @param input User question
   * @param apiRepository Provide complete API repository which would contain details about API endpoint (method, url, headers, and data), placeholders used in the API endpoint along with validation instructions which LLM will use.
   * @returns Array of relevant API sources populated with placeholder values.
   */
  getRealtimeSources(input: string, apiRepository: Array<Types.APIRepository>) {
    let runtimeStart = new Date().getTime();
    return new Promise(async (resolve, reject) => {
      this.utils.trackEvent(this.llm.app_name, 'question', { question: input }, this.llm.telemetry == true);
      let llmPrompts = new LLMPrompts();
      let prompt = llmPrompts.forRealtimeSources(input, apiRepository);
      let resp: any = {};
      let llmResponse: any = {};
      let payload: any = {};
      switch (this.llm.provider) {
        // --
        case "OpenAI":
          this.llm['temperature'] = 0.33;
          resp = await this.utils.callOpenAI(this.llm, prompt);
          // this.utils.log("I", "OpenAI response received", resp.data);
          llmResponse = resp.data.choices ? resp.data.choices[0].message.content : {};
          this.utils.trackUsage(this.llm.app_name, 'openai_calls', 1, this.llm.telemetry == true);
          break;
        // --
        case "GoogleAI":
          this.llm['temperature'] = 0.33;
          resp = await this.utils.callGoogleAI(this.llm, prompt);
          // this.utils.log("I", "GoogleAI response received", resp.data);
          llmResponse = resp.data.candidates ? resp.data.candidates[0].content.parts[0].text : {};
          this.utils.trackUsage(this.llm.app_name, 'googleai_calls', 1, this.llm.telemetry == true);
          break;
        // --
        //  .. add more providers here ...
        // -- 
      };
      let llmResponseObject = llmResponse.substring(llmResponse.indexOf('{'), llmResponse.lastIndexOf('}') + 1);
      payload = llmResponseObject ? JSON.parse(llmResponseObject) : {}; // only select JSON object
      payload['provider'] = this.llm.provider;
      if (!payload['api_endpoints'])
        payload['api_endpoints'] = [];
      payload.api_endpoints.forEach((api_endpoint: any, i: number) => {
        let placeholdersUndetermined: Array<any> = [];
        if (!api_endpoint['placeholders'])
          payload['placeholders'] = [];
        api_endpoint.placeholders.forEach((placeholder: any) => {
          if (!placeholder.determined)
            placeholdersUndetermined.push(placeholder.placeholder);
        });
        // missing placeholders
        api_endpoint['undetermined'] = placeholdersUndetermined;
        // status = OK or NOT-OK
        if (!api_endpoint['status']) {
          if (placeholdersUndetermined.length)
            api_endpoint['status'] = "NOT-OK";
          else
            api_endpoint['status'] = "OK";
        }
        this.utils.log("I", "API identified: " + api_endpoint.api.url.split('//')[1].split('/')[0], { "status": api_endpoint.status, "placeholders": api_endpoint.placeholders });
      });
      payload['runtime'] = Math.round((new Date().getTime() - runtimeStart) / 1000) + " seconds"
      this.utils.trackUsage(this.llm.app_name, 'apis_identified', payload.api_endpoints.length, this.llm.telemetry == true);
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
    let runtimeStart = new Date().getTime();
    return new Promise((resolve, reject) => {
      let inprogress = true;
      let updatedInput = this.utils.reformatInput(dataConfig, input);
      this.getRealtimeSources(updatedInput, apiRepository)
        .then((payload: any) => {
          let apiResults: any = [];
          payload.api_endpoints.forEach((api_endpoint: any, i: number) => {
            if (api_endpoint.status == "OK") {
              this.utils.callAPI(api_endpoint.api.method, api_endpoint.api.url, api_endpoint.api.headers, api_endpoint.api.data || false)
                .then((resp: any) => {
                  let response = resp.data;
                  let maxRecords = (dataConfig?.max_records && dataConfig?.max_records > 0) ? (dataConfig?.max_records > 10 ? 10 : dataConfig?.max_records) : 10;
                  Object.keys(response).forEach((key) => {
                    if (Array.isArray(response[key])) {
                      response[key].splice(maxRecords);  // Limit data results
                    }
                  });
                  this.utils.log("I", "[" + resp.status + "] API call ended (" + api_endpoint.api.url.split('//')[1].split('/')[0] + ")");
                  this.utils.trackUsage(this.llm.app_name, 'api_calls:' + resp.status, 1, this.llm.telemetry == true);
                  this.utils.trackUsage(this.llm.app_name, 'https://' + api_endpoint.api.url.split('//')[1].split('/')[0], 1, this.llm.telemetry == true);
                  apiResults.push({ "api_sources": api_endpoint.api.url.split('//')[1].split('/')[0], "data": response });
                  if (apiResults.length == payload.api_endpoints.length)
                    inprogress = false;
                }).catch((err: any) => {
                  this.utils.log("E", api_endpoint.api.url.split('//')[1].split('/')[0], err);
                  this.utils.trackUsage(this.llm.app_name, 'api_calls:failed', 1, this.llm.telemetry == true);
                  apiResults.push({ "api_sources": api_endpoint.api.url.split('//')[1].split('/')[0], "data": {} });
                  if (apiResults.length == payload.api_endpoints.length)
                    inprogress = false;
                });
            }
            else {
              apiResults.push({ "missing_placeholder_values": api_endpoint.undetermined.join(",") });
              this.utils.log("W", "Missing placeholder values: " + api_endpoint.undetermined.join(","));
              this.utils.log("W", "[skipping] " + api_endpoint.api.url.split('//')[1].split('/')[0]);
              this.utils.trackUsage(this.llm.app_name, 'api_calls:skipped', 1, this.llm.telemetry == true);
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
                "provider": this.llm.provider,
                "runtime": Math.round((new Date().getTime() - runtimeStart) / 1000) + " seconds"
              });
            }
            else
              timeout--;
          }, 500);
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
    let runtimeStart = new Date().getTime();
    return new Promise((resolve, reject) => {
      this.getDataFromRealtimeSource(input, apiRepository, options?.dataConfig)
        .then(async (realtimeData: any) => {
          let updatedInput = "";
          if (realtimeData.api_results.length) {
            if (options) {
              updatedInput = this.utils.reformatInput(options.dataConfig, input);
            }
            let llmPrompts = new LLMPrompts();
            let prompt = llmPrompts.forResponseWithData(updatedInput, realtimeData.api_results, options?.agentConfig);
            let resp: any = {};
            let llmResponse: any = {};
            let payload: any = {};
            switch (this.llm.provider) {
              // --
              case "OpenAI":
                resp = await this.utils.callOpenAI(this.llm, prompt);
                // this.utils.log("I", "OpenAI response received", resp.data);
                llmResponse = resp.data.choices ? resp.data.choices[0].message.content : {
                  "response": "Sorry! Something went wrong that hampered my ablity to respond to your question. Can you rephrase your question and try again?",
                  "status": "NOT-OK",
                  "additional_context": {
                    "entities": [],
                    "questions": input
                  }
                };
                this.utils.trackUsage(this.llm.app_name, 'openai_calls', 1, this.llm.telemetry == true);
                break;
              // --
              case "GoogleAI":
                resp = await this.utils.callGoogleAI(this.llm, prompt);
                // this.utils.log("I", "GoogleAI response received", resp.data);
                llmResponse = resp.data.candidates ? resp.data.candidates[0].content.parts[0].text : {
                  "response": "Sorry! Something went wrong that hampered my ablity to respond to your question. Can you rephrase your question and try again?",
                  "status": "NOT-OK",
                  "additional_context": {
                    "entities": [],
                    "questions": input
                  }
                };
                this.utils.trackUsage(this.llm.app_name, 'googleai_calls', 1, this.llm.telemetry == true);
                break;
              // --
              //  .. add more providers here ...
              // -- 
            };
            if (resp.status == 200) {
              this.utils.log("I", "Response OK");
              let llmResponseObject = llmResponse.substring(llmResponse.indexOf('{'), llmResponse.lastIndexOf('}') + 1);
              payload = llmResponseObject ? JSON.parse(llmResponseObject) : {
                "response": llmResponse,
                "status": "OK",
                "additional_context": {
                  "entities": [],
                  "questions": input
                }
              }; // only select JSON object
              payload.additional_context['data'] = [];
              payload.additional_context['sources'] = [];
              realtimeData.api_results.forEach((result: any) => {
                payload.additional_context['data'].push(result.data);
                payload.additional_context['sources'].push(result.api_sources);
              });
              this.utils.trackUsage(this.llm.app_name, 'llm_response:' + resp.status, 1, this.llm.telemetry == true);
              resolve({
                "ai_response": payload.response,
                "ai_status": payload.status,
                "ai_context": payload.additional_context,
                "provider": this.llm.provider,
                "runtime": Math.round((new Date().getTime() - runtimeStart) / 1000) + " seconds"
              });
            }
            else {
              this.utils.log("W", "No response - BAD DATA");
              let possibleResponses = [
                "I'm sorry, but the data I obtained seems to be invalid. Can you please double-check and rephrase your question?",
                "Unfortunately, it appears that the information I looked up isn't insufficient. Could you correct it or provide more details?",
                "The data obtained doesn't seem to be reliable. Can you rephrase your question with additional information?",
                "It looks like the I obtained to answer your query is incorrect. Could you please provide more information or clarify your question?",
                "I'm having trouble with the data I received. Can you check and provide additional information and rephrase your question for better results?"
              ];
              this.utils.trackUsage(this.llm.app_name, 'llm_response:' + resp.status, 1, this.llm.telemetry == true);
              resolve({
                "ai_response": possibleResponses[Math.floor(Math.random() * possibleResponses.length)],
                "ai_status": "BAD-DATA",
                "ai_context": {
                  "sources": [],
                  "entities": [],
                  "questions": input,
                  "data": []
                },
                "provider": this.llm.provider,
                "runtime": Math.round((new Date().getTime() - runtimeStart) / 1000) + " seconds"
              });
            }
          }
          else {
            this.utils.log("W", "No APIs identified");
            let possibleResponses = [
              "I'm sorry, but I couldn't find any information on that topic. Would you mind rephrasing your question and trying again?",
              "Unfortunately, I couldn't locate any sources relevant to your query. Could you please rephrase and ask again?",
              "I searched, but couldn't find any available sources for your question. Can you rephrase it to help me assist you better?",
              "It appears there are no sources available to answer your question. Could you rephrase it so I can try again?",
              "I couldn't locate a source to provide the information you're looking for. Could you please rephrase your question for better results?"
            ];
            this.utils.trackUsage(this.llm.app_name, 'llm_response:skipped', 1, this.llm.telemetry == true);
            resolve({
              "ai_response": possibleResponses[Math.floor(Math.random() * possibleResponses.length)],
              "ai_status": "NO-SOURCE",
              "ai_context": {
                "sources": [],
                "entities": [],
                "questions": input,
                "data": []
              },
              "provider": this.llm.provider,
              "runtime": Math.round((new Date().getTime() - runtimeStart) / 1000) + " seconds"
            });
          }
        });
    });
  };

}; // class

export = AIDapter;