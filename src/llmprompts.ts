import Types from "./types";
import Utils from "./utils";

class LLMPrompts {

  private utils = new Utils();

  /**
   * Prompt structure:
   * #System
   * #Context
   * #Format
   * #Task
   */

  // ---------------------------------------------------------------
  // Constructor
  constructor() { }

  // ---------------------------------------------------------------
  // Prompt to identify APIs and gather realtime data
  forRealtimeSources(input: string, apiRepository: Array<Types.APIRepository>) {
    let system = `# System`;
    system += `
    You are an API server that identifies suitable APIs that will help answer my question. Once the APIs have been identified, you are expected to replace all placeholders with valid URL-encoded values. The API repository that is provided as context below, contains instructions that will help you determine appropriate placeholder values and validation requirements to ensure appropriate values are determined.  Note: Today's date is, ` + new Date().toDateString() + `, which can be used to derive dates relative to today.`;
    system += `
    You are an expert at generateing meaningful and complete response. You do this by coming up with 3 inquisitive deep-dive questions in your mind based on the provided context and my question below. Then, using all the relevant aspects of my question below and the 3 deep-dive questions you come up with, you form a completely new question in your mind. Your job is to ultimately respond only to this new question instead of my question below. It is important that you perform these steps in your mind and not show the workings or intermediate results to me. This will provide me the confidence that you are an expert at answering questions completely.
    `;
    let context = `# Context`;
    context += `
    Identified APIs must strictly belong within the following list.
    """`;
    apiRepository.forEach((api, i) => {
      context += `
      - `+ JSON.stringify(api) + `
      `;
    });
    context += `
    """
    `;

    let task = `# Question`;
    task += `
      "` + input + `"
      `;
    task += `# Task`;
    task += `
    Look at my question above and if it is within constitutional bounds of fairness, accountability, responsibility, harmlessness, respect, compliance, and humane, provide your response, else politely decline to respond.
    `;
    let format = `# Format`;
    let apiidresult: Array<Types.APIidResult> = [
      {
        "api": {
          "method": "as specified in the identified api_endpoint.",
          "url": "rewrite url after replacing placeholders where you can determine a value based on my question.",
          "headers": "rewrite headers after replacing placeholders where you can determine a value based on my question."
        },
        "placeholders": [
          {
            "placeholder": "individual placeholder from API repository.",
            "determined": "Boolean true if a valid placeholder value was determined, else Boolean false.",
          },
        ],
        "status": "say 'OK' only if all 'determined' fields are true, else say 'NOT-OK'."
      }
    ];
    format += `
    You must strictly follow the below JSON structure to generate your response.
    ***
    {
      "api_endpoints":
    `;
    format += JSON.stringify(apiidresult);
    format += `
    }
    ***`;
    format += `
    Before providing your final response, go through the following steps and validate the following:
    - only the API repository is used for API identification and not your prior knowledge of popular APIs,
    - if an API is identified, response must include 'api', 'placeholders', and 'status' fields,
    - all placeholders in the identified 'api_endpoint' must be replaced with appropriate values,
    - all 'placeholders' specified in the identified API from the API repository must be listed in the response 'placeholders' array,
    - the 'determined' flag for each placeholder must be appropriately set, and so the 'status' flag must also set based on overall placeholders determination.`;
    let prompt = {
      "system": system,
      "context": context,
      "format": format,
      "task": task
    };
    // this.utils.log("I", "Prompt (for API identification)", system + context + format + task);
    return prompt;
  };

  // ---------------------------------------------------------------
  // Prompt to get LLM response based on realtime data
  forResponseWithData(input: string, data: any, agent: any) {
    let system = `# System`;
    system += `
    You are `+ (agent.role ? agent.role : `a digital assistant`) + (agent.personality ? ` with ` + agent.personality + ` personality. ` : ` `) + `who responds in the specified JSON format. You always maintain a respectful, humane and informative tone in your conversations.`;
    system += `` + (agent.expert_at ? `You are also an expert at ` + agent.expert_at + `. ` : ``);
    system += `
    You must primarily rely on the context provided below to respond to my question and politely decline to engage in any conversation around legal matters, law and order, medical guidance, financial guidance, and abusive or profanity-based topics.`;
    system += `
    You are an expert at generateing meaningful and complete response. You do this by coming up with 3 inquisitive deep-dive questions in your mind based on the provided context and my question below. Then, using all the relevant aspects of my question below and the 3 deep-dive questions you come up with, you form a completely new question in your mind. Your job is to ultimately respond only to this new question instead of my question below. It is important that you perform these steps in your mind and not show the workings or intermediate results to me. This will provide me the confidence that you are an expert at answering questions completely.
    `;
    let context = `# Context 
    """
    `;
    context += JSON.stringify(data);
    context += `
    """
      `;
    let task = `# Question`;
    task += `
      "` + input + `"
      `;
    task += `# Task`;
    task += `
    Look at my question above and if it is within constitutional bounds of fairness, accountability, responsibility, harmlessness, respect, compliance, and humane, provide your response, else politely decline to respond.
      `;
    let format = `# Format`;
    format += `
    You must strictly follow the below JSON structure and instructions to generate your response.
    ***
    `;
    let llmResponse: Types.LLMResponse = {
      "additional_context": {
        "question": "Write the new question from your mind here, which you formed using the relevant aspects of my question and the deep-dive follow-up questions.",
        "topic": "Describe the context of the conversation in less than 60 words.",
        "entities": [{ "Entity Type 1": ["Array of Entity Values"] }, { "Entity Type 2": ["Array of Entity Values"] }],
        "sources": ["Array of API sources found in the context or an empty array"],
      },
      "response": `Provide your response here in markdown format using the following guidance:
      - If the context indicates missing values, request more information in a simple tone, else
      - respond to the full or part of the question completely within ` + (agent.max_words ? (agent.max_words > 200 ? 200 : agent.max_words) : 200) + ` words.`,
      "status": "If there are missing placeholder values, say 'FOLLOW-UP', else say 'OK'."
    };
    format += JSON.stringify(llmResponse);
    format += `
    ***
    Before providing your final response, go through the following steps and validate the following:
    - Make sure you have formulated a new question based on all the relevant aspects of my question and the deep-dive follow-up questions you came up with. The new question must appear in the 'question' field within 'additional_context'.
    - You must respond only to the newly formulated question and provide your response in 'response' field.
    - You must update the 'status' within 'additional_context' to indicate if a complete response was provided or a follow-up is necessary.
    - a short and suitable 'topic' must be identified and also placed within 'additional_context' for future context.
    - all Entities must be identified from this conversation and listed as key-value pairs within 'entities' array of 'additional_context'.
    - 'sources' must be identified and listed within 'additional_context'.
    `;
    let prompt = {
      "system": system,
      "context": context,
      "format": format,
      "task": task
    };
    // this.utils.log("I", "Prompt (for response)", system + context + task + format);
    return prompt;
  };

};

export = LLMPrompts;