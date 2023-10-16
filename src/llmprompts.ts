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
      "response": "Provide your response in first-person as follows with appropriate sections, titles, lists, etc.: (1) If you have all the information to respond to the question completely, please do so within " + (agent.max_words ? (agent.max_words > 200 ? 200 : agent.max_words) : 200) + " words, or (2) If you find any information is missing, please provide clear guidance on what I must provide to get a complete response.",
      "status": "Say 'FOLLOW-UP' if there is any missing information, else say 'OK'. Note that the status does not depend on the confidence of your response.",
      "additional_context": {
        "entities": [{ "Entity Type 1": ["Array of Entity Values"] }, { "Entity Type 2": ["Array of Entity Values"] }],
        "sources": ["Array of API sources found in the context or an empty array"],
        "original_question": input,
        "response_summary": "Provide contexual information, such as the main idea of this conversation, what is this conversation about, and who is it about. Write in third-person in less than 200 words.",
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
    - whether the question was answered completely based on available information.
    - if information was missing, it is included in the response posed as a follow-up question.
    - whether the status is updated appropriately.
    - whether all key Entity Types and Entity Values are identified from this conversation and listed as key-value pairs.
    - whether sources have been identified and listed.
    - whether response_summary contains enough information about the context of this conversation.
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