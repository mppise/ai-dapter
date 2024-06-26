import axios from "axios";
import Mixpanel from "mixpanel";

class Utils {
  private mixpanel = Mixpanel.init('2efd45db81216e8c85525dee82202bc4');

  // ---------------------------------------------------------------
  // Constructor
  constructor() { }

  // ---------------------------------------------------------------
  // Get all date and time elements in JSON format
  getDate() {
    let dateTimeParts = new Date().toISOString().split('T');
    let dateParts = dateTimeParts[0].split('-');
    let timeParts = dateTimeParts[1].split(':');
    return {
      "date": {
        "year": parseInt(dateParts[0]),
        "month": parseInt(dateParts[1]),
        "day": parseInt(dateParts[2]),
      },
      "time": {
        "timezone": "UTC",
        "hour": parseInt(timeParts[0]),
        "min": parseInt(timeParts[0]),
        "sec": parseInt(timeParts[2].split('.')[0])
      }
    }
  };

  // ---------------------------------------------------------------
  // Logger
  log(severity: "I" | "W" | "E", message: string, data?: any) {
    let logentry = "AI-DAPTER :: " + "[" + severity + "]: " + message;
    if (data) {
      if (typeof data == "string")
        logentry += "\n>>\t" + data;
      else
        logentry += "\n>>\t" + JSON.stringify(data);
    }
    console.log(logentry);
  };

  // ---------------------------------------------------------------
  // Telemetry functions
  initializeTelemetry(app_name: string, telemetry: boolean) {
    if (telemetry)
      this.mixpanel.people.set_once(app_name, { $name: app_name, $distinct_id: app_name });
    else
      this.log("W", "Telemetry is turned off");
  };
  trackEvent(app_name: string, event: string, payload: any, telemetry: boolean) {
    if (telemetry) {
      payload['distinct_id'] = app_name;
      this.mixpanel.track(event, payload);
    }
    else
      this.log("W", "Telemetry is turned off");
  };
  trackUsage(app_name: string, metric: string, increment: number, telemetry: boolean) {
    if (telemetry)
      this.mixpanel.people.increment(app_name, metric, increment);
    else
      this.log("W", "Telemetry is turned off");
  };

  // ---------------------------------------------------------------
  // Call API using axios
  callAPI(method: string, url: string, headers: any, data?: any) {
    type AxiosObj = Record<string, any>
    let axiosObj: AxiosObj = {};
    axiosObj.method = method;
    axiosObj.url = url;
    axiosObj.headers = headers;
    if (data)
      axiosObj.data = data;
    return axios(axiosObj);
  };

  reformatInput(dataConfig: any, originalInput: string) {
    let entities: Array<any> = [];
    let questions: Array<any> = [];
    if (dataConfig?.additional_context) {
      let maxContext = (dataConfig?.max_contexts && dataConfig?.max_contexts > 0) ? (dataConfig?.max_contexts > 2 ? 2 : dataConfig?.max_contexts) : 2;
      dataConfig?.additional_context.splice(0, dataConfig?.additional_context.length - maxContext); // Limit context results
      dataConfig?.additional_context.forEach((context: any) => {
        if (Object.keys(context).length > 0) {
          if (context.questions)
            questions.push(context.questions);
          if (context.entities)
            entities.push(context.entities);
        }
      });
    }
    questions.push(originalInput);
    let updatedInput = questions.join(" ");
    if (entities.length)
      updatedInput += " (Consider: " + entities.join(' ') + ")";
    return updatedInput;
  };

  // ---------------------------------------------------------------
  // Call OpenAI API using axios
  async callOpenAI(llmConfig: any, prompt: any) {
    return axios({
      "method": "POST",
      "url": llmConfig.endpoint,
      "headers": {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + llmConfig.authentication.api_key,
        "OpenAI-Organization": llmConfig.authentication.org_id
      },
      "data": {
        "model": llmConfig.model_name,
        "messages": [
          { "role": "system", "content": prompt.system },
          {
            "role": "user", "content": [
              { "type": "text", "text": prompt.context + prompt.task + prompt.format }
            ]
          }
        ],
        "temperature": llmConfig.temperature || 0.82
      }
    });
  };

  // ---------------------------------------------------------------
  // Call GoogleAI API using axios
  async callGoogleAI(llmConfig: any, prompt: any) {
    return axios({
      "method": "POST",
      "url": llmConfig.endpoint + "?key=" + llmConfig.authentication.api_key,
      "headers": {
        "Content-Type": "application/json"
      },
      "data": {
        "contents": [{
          "parts": [{
            "text": prompt.system
          },
          {
            "text": prompt.context
          },
          {
            "text": prompt.task
          },
          {
            "text": prompt.format
          }]
        }],
        "generationConfig": {
          "temperature": llmConfig.temperature || 0.82
        },
        "safety_settings": [
          {
            "category": "HARM_CATEGORY_SEXUALLY_EXPLICIT",
            "threshold": "BLOCK_ONLY_HIGH",
          },
          {
            "category": "HARM_CATEGORY_HATE_SPEECH",
            "threshold": "BLOCK_ONLY_HIGH",
          },
          {
            "category": "HARM_CATEGORY_HARASSMENT",
            "threshold": "BLOCK_ONLY_HIGH",
          },
          {
            "category": "HARM_CATEGORY_DANGEROUS_CONTENT",
            "threshold": "BLOCK_ONLY_HIGH",
          }
        ]
      }
    });
  };

  // ---------------------------------------------------------------
  // Call ClaudeAI API using axios
  async callClaudeAI(llmConfig: any, prompt: any) {
    return axios({
      "method": "POST",
      "url": llmConfig.endpoint,
      "headers": {
        "Content-Type": "application/json",
        "X-API-Key": llmConfig.authentication.api_key,
        "anthropic-version": "2023-06-01"
      },
      "data": {
        "model": llmConfig.model_name,
        "max_tokens": 4096,
        "system": prompt.system,
        "messages": [
          {
            "role": "user", "content": [
              { "type": "text", "text": prompt.context + prompt.task + prompt.format }
            ]
          }
        ],
        "temperature": llmConfig.temperature || 0.82
      }
    });
  };

}; // class

export = Utils;