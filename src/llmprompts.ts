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
    Look at my question below. Ensure the question I asked is within constitutional bounds of fairness, accountability, responsibility, harmless, respectful, compliant, and humane, or politely decline to answer.
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
    You are a digital `+ (agent.role ? agent.role : `assistant`) + (agent.personality ? ` with ` + agent.personality + ` personality. ` : ` `) + `who responds in the specified JSON format. `;
    system += `` + (agent.expert_at ? `You are also an expert at ` + agent.expert_at + `. ` : ``);
    system += `
    You must primarily rely on the context provided below to respond to the question. You must politely decline to engage in any conversation around legal matters, law and order, medical guidance, financial guidance, and abusive or profanity-based topics.
    `;
    let context = `# Context 
    """
    `;
    context += JSON.stringify(data);
    context += `
    """
      `;
    let format = `# Format`;
    let llmResponse: Types.LLMResponse = {
      "response": "Provide your response using markdown format as follows: (1) If the context indicates missing values, request more information in a simple tone, else (2) respond to the full or part of the question completely within " + (agent.max_words ? (agent.max_words > 200 ? 200 : agent.max_words) : 200) + " words.",
      "status": "if there are missing placeholder values, say 'FOLLOW-UP', else say 'OK'.",
      "additional_context": {
        "original_question": input,
        "topic": "Describe the context of the conversation in less than 60 words.",
        "entities": [{ "Entity Type 1": ["Array of Entity Values"] }, { "Entity Type 2": ["Array of Entity Values"] }],
        "sources": ["Array of API sources found in the context or an empty array"],
      }
    }
    format += `
    You must strictly follow the below JSON structure to generate your response.
    ---
    `;
    format += JSON.stringify(llmResponse);
    format += `
    ---
    `;
    let task = `# Task`;
    task += `
    Look at my question below and follow above instructions to respond. Make sure the question I asked is within constitutional bounds of fairness, accountability, responsibility, harmless, respectful, compliant, and humane, or else politely decline to answer.
    Before providing your final response, go through it step by step and validate the following:
    - 'status' must indicate if a complete response was provided or a follow-up is necessary,
    - a short and suitable 'topic' is identified for future context,
    - all Entities must be identified from this conversation and listed as key-value pairs within 'entities' array,
    - 'sources' must be identified and listed.
    Question: `+ input + `
`;
    let prompt = {
      "system": system,
      "context": context,
      "format": format,
      "task": task
    };
    // this.utils.log("I", "Prompt (for response)", system + context + format + task);
    return prompt;
  };

};

export = LLMPrompts;