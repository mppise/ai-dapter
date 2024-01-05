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
  }
  trackEvent(app_name: string, event: string, payload: any, telemetry: boolean) {
    if (telemetry) {
      payload['distinct_id'] = app_name;
      this.mixpanel.track(event, payload);
    }
    else
      this.log("W", "Telemetry is turned off");
  }
  trackUsage(app_name: string, metric: string, increment: number, telemetry: boolean) {
    if (telemetry)
      this.mixpanel.people.increment(app_name, metric, increment);
    else
      this.log("W", "Telemetry is turned off");
  }

  // ---------------------------------------------------------------
  // Call API using axios
  callAPI(method: string, url: string, headers: object, data?: object) {
    type AxiosObj = Record<string, any>
    let axiosObj: AxiosObj = {};
    axiosObj.method = method;
    axiosObj.url = url;
    axiosObj.headers = headers;
    if (data)
      axiosObj.data = data;
    return axios(axiosObj);
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
          { "role": "user", "content": prompt.context + prompt.task + prompt.format }
        ],
        "temperature": llmConfig.temperature || 0.6
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
          "temperature": llmConfig.temperature || 0.6
        }
      }
    });
  };

}; // class

export = Utils;