import axios from "axios";

class Utils {

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
    let logentry = "[LOG] " + "(" + severity + "): " + message;
    if (data) {
      logentry += "\n... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ...\n";
      if (typeof data == "string")
        logentry += data;
      else
        logentry += JSON.stringify(data, null, 2);
      logentry += "\n... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ... ...\n";
    }
    console.log(">>", logentry);
  };

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
          { "role": "system", "content": prompt.system + prompt.context + prompt.format },
          { "role": "user", "content": prompt.task }
        ],
        "temperature": llmConfig.temperature || 0.6
      }
    });
  };


}; // class

export = Utils;