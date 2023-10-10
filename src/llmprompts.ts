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
    You are an API server that identifies suitable API endpoints that can be later used to obtain data that will help answer my question. Once the APIs have been identified, you are expected to first keep track of all the placeholders and then replace them with valid URL-encoded values. The API repository provided below consists of various fields which will help you (1) identify the APIs, and (2) determine appropriate placeholder values that meets the specified validation requirement.
    `;
    let context = `# Context`;
    context += `
    Identified APIs must strictly belong within the following list. If none of the APIs from the list can be used to answer the question, do not respond.
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
        "api": { "method": "?", "url": "?", "headers": "?" },
        "placeholders": [
          {
            "placeholder": "placeholders from API repository. Today's date is, " + new Date().toDateString() + ", and can be used to derive dates relative to today.",
            "determined": "Boolean true a valid placeholder value was determined by you | false if placeholder value does not meet the validation criteria which is mentioned in the API endpoint.",
          },
        ],
        "status": "say 'OK' only if all 'determined' fields are true, else say 'NOT-OK'"
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
    Look at my question below and follow above instructions to respond. Make sure the question I asked is within constitutional bounds of fairness, accountability, responsibility, harmless, respectful, compliant, and humane, or else politely decline to answer.
    Before providing your final response, go through it step by step and validate the following:
    - whether all APIs have been identified based on my question,
    - whether all placeholders values have been identified.
    - whether the API endpoint is updated with placeholder values.
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
    system += `You can only make conversations based on the provided context. If a response cannot be formed strictly using the context, politely say you don't have knowledge about that topic.
    `;
    system += `` + (agent.expert_at ? `You are also an expert at ` + agent.expert_at + `. ` : ``);
    system += `
    You must rely only on the provided context to generate a response and must not use your prior knowledge or general knowledge to respond to the question. You must politely decline to engage in any conversation related to legal advise, law and order, medical guidance, financial guidance, and abusive or profanity-based topics.
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
      "response": "Provide your response using basic markdown formatting elements as follows: (1) If you have all the information to respond to the question completely, please do so within " + (agent.max_words ? (agent.max_words > 200 ? 200 : agent.max_words) : 200) + " words. Create appropriate sections, titles, tables, etc. (2) If you find any information is missing, please provide clear guidance on what I must provide to get a complete response.",
      "status": "Say 'FOLLOW-UP' if there is any missing information, else say 'OK'. Note that the status does not depend on the confidence of your response.",
      "additional_context": {
        "original_question": input,
        "response_summary": "Summarize the context of this conversation in less than 50 words. Include who and what is this conversation about.",
        "entities": {
          "Entity Type from the conversation": ["Array of Corresponding Entity Values"]
        }
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
    Question: `+ input + `
`;
    let prompt = {
      "system": system,
      "context": context,
      "format": format,
      "task": task
    };
    this.utils.log("I", "Prompt (for response)", system + context + format + task);
    return prompt;
  };

};

export = LLMPrompts;