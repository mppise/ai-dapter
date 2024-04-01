module Types {

  type apiEndpoint = {
    "method": string,
    "url": string,
    "headers"?: any,
    "data"?: any
  };
  type placeholders = {
    "placeholder": string,
    "validation_criteria": string,
    "default"?: string
  };
  type placeholderidResult = {
    "placeholder": string,
    "determined": any
  };

  // ---------------------------------------------------------------
  // API identification result
  export type LLMModelConfig = {
    "app_name": string,
    "provider": "OpenAI" | "GoogleAI" | "ClaudeAI",
    "model_name"?: string,
    "endpoint"?: string,
    "authentication": {
      "api_key": string,
      "org_id"?: string
    },
    "temperature"?: number,
    "telemetry"?: boolean
  };

  // ---------------------------------------------------------------
  // Agent configuration
  export type AgentConfig = {
    "role": string,
    "personality"?: string,
    "language"?: string,
    "expert_at"?: string,
    "max_words"?: number
  };

  // ---------------------------------------------------------------
  // Data configuration
  export type DataConfig = {
    "max_records": number,
    "max_contexts"?: number,
    "additional_context"?: Array<any>
  };

  // ---------------------------------------------------------------
  // API repository
  export type APIRepository = {
    "api_info": {
      "title": string,
      "description": string
    },
    "api_endpoint": apiEndpoint,
    "placeholders": Array<placeholders>
  };

  // ---------------------------------------------------------------
  // API identification result
  export type APIidResult = {
    "api": apiEndpoint,
    "placeholders": Array<placeholderidResult>,
    "status": string
  };

  // ---------------------------------------------------------------
  // LLM response format
  export type LLMResponse = {
    "response": string,
    "status": string,
    "additional_context": {
      "questions": string,
      "entities": Array<any>,
      "sources"?: Array<any>,
      "data"?: Array<any>,
    }
  };

  // ---------------------------------------------------------------
  // Options for calling core method
  export type AIDapterOptions = {
    "agentConfig": Types.AgentConfig,
    "dataConfig": Types.DataConfig
  };


};

export = Types;