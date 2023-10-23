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
    You are an API server that identifies suitable APIs that will help answer my question. Once the APIs have been identified, you are expected to replace all placeholders with valid URL-encoded values. The API repository that is provided as context below, contains instructions that will help you determine appropriate placeholder values and validation requirements to ensure appropriate values are determined.  Note: Today's date is, ` + new Date().toDateString() + `, which can be used to derive dates relative to today.
    To ensure that you respond the question completely, follow these steps:
    ---
    Step 1: Think of 3 possible inquisitive deep-dive questions that can be asked as follow-up questions based on the context and my original question below.
    Step 2: Combine my original question with the deep-dive questions you came up with and form a completely new question.
    ---
    Use the newly formed question to determine suitable APIs.
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
    ---
    {
      "api_endpoints":
    `;
    format += JSON.stringify(apiidresult);
    format += `
    }
    ---
    `;
    let task = `# Task`;
    task += `
    Look at the question below. If the question I asked is within constitutional bounds of fairness, accountability, responsibility, harmless, respectful, compliant, and humane, proeed to find suitable APIs as instructed above, or politely decline to answer.
    Before providing your final response, go through it step by step and validate the following:
    - only the API repository is used for API identification and not your prior knowledge of popular APIs,
    - if an API is identified, response must include 'api', 'placeholders', and 'status' fields,
    - all placeholders in the identified 'api_endpoint' must be replaced with appropriate values,
    - all 'placeholders' specified in the identified API from the API repository must be listed in the response 'placeholders' array,
    - the 'determined' flag for each placeholder must be appropriately set, and so the 'status' flag must also set based on overall placeholders determination.
    `+ input + `
    `;
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
    You must primarily rely on the context provided below to respond to the question and politely decline to engage in any conversation around legal matters, law and order, medical guidance, financial guidance, and abusive or profanity-based topics.
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
      Look at my question above and if it is within constitutional bounds of fairness, accountability, responsibility, harmless, respectful, compliant, and humane, provide your response as instructed in the format requirements below, else politely decline to respond.
      `;
    let format = `# Format`;
    format += `
    You must strictly follow the below JSON structure and instructions to generate your response. Provide a meaningful and complete response by following these steps:
    Step 1: Think of 3 inquisitive deep-dive questions that can be asked as follow-up questions based on the context and my question above.
    Step 2: Formulate a new question by combining the original question with the 3 deep-dive questions from previous step.'
    ***
    `;
    let llmResponse: Types.LLMResponse = {
      "additional_context": {
        "question": "Write the new question formed using above steps here. You must respond to this new question.",
        "topic": "Describe the context of the conversation in less than 60 words.",
        "entities": [{ "Entity Type 1": ["Array of Entity Values"] }, { "Entity Type 2": ["Array of Entity Values"] }],
        "sources": ["Array of API sources found in the context or an empty array"],
      },
      "response": `Provide your response here in markdown format and the following guidance to respond appropriately:
      - If the context indicates missing values, request more information in a simple tone, else
      - respond to the full or part of the question completely within ` + (agent.max_words ? (agent.max_words > 200 ? 200 : agent.max_words) : 200) + ` words.`,
      "status": "If there are missing placeholder values, say 'FOLLOW-UP', else say 'OK'."
    };
    format += JSON.stringify(llmResponse);
    format += `
    ***
    Before providing your final response, go through the following steps and validate the following:
    - Make sure you have formulated a new question based on all the relevant aspects of my original question and the deep-dive follow-up questions you created. The new question must appear in the 'question' field within 'additional_context' and must be used by you to provide your response.
    - You must respond only to the newly formulated question and provide your response in 'response' field.
    - You must update the 'status' within 'additional_context' to indicate if a complete response was provided or a follow-up is necessary.
    - a short and suitable 'topic' must be identified and placed within 'additional_context' for future context.
    - all Entities must be identified from this conversation and listed as key-value pairs within 'entities' array of 'additional_context'.
    - 'sources' must be identified and listed.
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