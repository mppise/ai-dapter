![AI-Dapter](./res/AI-Dapter_Logo_528x132.png)

# AI-Dapter

Adapter to connect AI LLM with real-time grounding sources and data


## Release Notes 

Listing major enhancements

|**Release**|**Date**|**Key Features**|
|:----------:|:----------:|----------|
|2.0.0|Jan 05, 2024|Major update: Supports GoogleAI in addition to OpenAI.|
|1.3.0|Dec 16, 2023|Improved prompts to utilize relevant data and generate relevant responses. Responses for all methods now provide runtime information.|
|1.2.9|Nov 03, 2023|(1) Agent configuration can specify (optional) language key. When this is set, LLM always thinks and responds in specified language (irrespective of input language). _Note_: Translation quality may not be optimal in some cases, so thorough testing is strongly adviced. (2) Response from all-in-one method includes grounding data used by LLM to geenrate a response. This should improve reliability.|
|1.2.8|Oct 26, 2023|Incorporated [deep-dive prompting technique](https://mangeshpise.medium.com/deep-dive-prompting-technique-to-improve-the-quality-of-llms-response-233f3728223e) to improve quality of response.|
|1.2.2|Oct 18, 2023|Improved LLM prompts and logic for API determination.|
|1.1.1|Oct 09, 2023|Introduced LLM prompts to incorporate a flavor of constitutional AI to ensure user input is fair, responsibile, respectful, and humane.|
|1.1.0|Oct 08, 2023|Introduced ability to build context/memory for follow-up questions.|
|1.0.0|Oct 08, 2023|Initial launch.|



## 1. Concept

As multi-modal artificial intelligence models, LLMs have broad applicability for generating content with minimal instructions. Prompting techniques such as zero-shot or few-shot are popular amongst everyday users of chat applications built on top of such LLMs. That said, although the quality of the response is excellent, how much can we trust it? How do we know the model isn't "making up" (a.k.a. hallucinating) on-the-fly?

As a result, [**grounding**](https://techcommunity.microsoft.com/t5/fasttrack-for-azure/grounding-llms/ba-p/3843857) LLMs by providing contextual data in combination with proper prompting techniques is very important. Using prompts with grounded information as context to help LLM generate a better response is a practice widely followed. 

One such approach is Retrieval-Augmented Generation (RAG), which relies on storing and searching text embeddings provided to LLM along with the prompt. However, RAG relies on static information converted into text embeddings and storing them in graph databases (a.k.a. vector databases) so that relevant information can be *retrieved* from it and *augmented* via grounding to *generate* text/response.

The RAG pattern might raise the question of whether real-time data can be used along with LLMs to generate effective and reliable responses. The simple answer is, *"Of course, yes!"*. But that means a lot more responsibilities on the shoulders of Application Developers. The developer needs to call the API to wrap the response within a prompt to have LLM generate a relevant response. But will calling the same API over and over for every question work? - Most probably not! How can we dynamically determine which API should be called and which parameters must be passed based on the question? That also sounds like a capability for LLM.

That's where AI-Dapter (read as, *AI Adapter*) comes into play. AI-Dapter accelerates the LLM-based application development process for developers, allowing them to focus only on applications while offloading the burden of following activities to LLM.

- **identifying** the right API endpoints from a pre-defined API repository,
- **acquiring** real-time data from the identified API endpoints, 
- **generating** a response using the LLM model of choice.


## 2. Developer Experience

The developer experience is improved tremendously by plugging in the AI-Dapter framework within the application code and seamlessly using it as a [**black box**](https://en.wikipedia.org/wiki/Black_box) to perform LLM-based responses to user's questions. Note that these user questions themselves might be close to a zero-shot prompt! 

The actual work behind this black box includes:

- the ability to integrate an LLM model of your choice with your credentials (Note: Currently, only OpenAI GPT models are supported),

- an integrated engine that leverages user inputs to perform identification of -
    - API-based data-sources, 
    - acquisition of real-time data from those APIs, and 
    - generation of response grounded by real-time data using LLM.

### Discussions / Feature Requests:

Please submit feedback or new feature requests via [GitHub Discussions](https://github.com/mppise/ai-dapter/discussions).

### Issues:

Please submit your issues via [GitHub Issues](https://github.com/mppise/ai-dapter/issues).


## 3. Installation

Run the following on the command line to install the AI-Dapter for your NodeJS project. Make sure you are within your project's root directory.

```bash
npm install ai-dapter --save
```


## 4. Setup and Initialization

### 4.1. Importing AI-Dapter

Assuming you have set up a typescript NodeJS project, import the AIDapter class as follows.

```js
import AIDapter from "ai-adapter";
```


### 4.2. Initialize the setup

To initialize AI-Dapter, you must pass some mandatory and optional parameters to complete the setup. An example is shown below, followed by documentation of the supported parameters.

```js
const ai = new AIDapter({
  "app_name": "<<Short App Name>>"
  "provider": "OpenAI",
  "model_name": "gpt-3.5-turbo-16k",
  "endpoint": "https://api.openai.com/v1/chat/completions",
  "authentication": {
    "api_key": "<<Your OPENAI Key>>",
    "org_id": "<<Your OPENAI Org ID>>"
  },
  "temperature": "<<between 0.0 and 2.0>>"
});
```

List of supported parameters to initialize the setup.

|**Parameter**|**Mandatory(M) / Optional(O)**|**Purpose**|**Possible values**|
|----------|:----------:|----------|----------|
|`app_name`|M|Short app name.|-|
|`provider`|M|The provider of LLM Model. _Note_: Currently, only models provided directly by OpenAI are supported.|"OpenAI"|
|`model_name`|O|Allows you to select any model released by the provider. We recommend using models that allow large token sizes, such as `gpt-3.5-turbo-16k` or `gemini-pro` or `claude-3-haiku-20240307`.|-|
|`endpoint`|O|The endpoint from where the provider serves the LLM model. You may have to refer to provider-specific documentation. For example, the OpenAI chat completion model is served from the `https://api.openai.com/v1/chat/completions` endpoint, GoogleAI model is served from `https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent` and ClaudeAI model is served from `https://api.anthropic.com/v1/messages`.|-|
|`authentication`|M|Provide authentication details as specified by your provider. For example, since OpenAI requires an API Key and an Organization ID, those are provided under the `api_key` and `org_id` fields, as shown in the initialization example above.|-|
|`telemetry`|O|Telemetry data collection. Default is true.| true/false |


## 5. Agent & Data Configuration Options

AI-Dapter allows you to customize specific agent configurations, such as adding roles, personalities, etc. Along the same lines, you can customize particular data configurations, such as controlling the number of records from real-time API responses, passing additional context or grounding information to simulate follow-ups, etc. 

The agent and configuration options are passed as a single object as follows. Refer to the appropriate sections below to look up and adjust these configuration values.

```js
let options: AIDapterOptions = {
  "agentConfig": { 
    "role": "personal assistant" 
  },
  "dataConfig": { 
    "max_records": 7 
  }
};
```


#### 5.1. Agent Configuration

Below are currently supported agent configuration parameters. Add these fields under the `agentConfig` object.

|**Parameter**|**Mandatory(M) / Optional(O)**|**Purpose**|**Possible values**|
|----------|:----------:|----------|----------|
|`role`|M|Helps guide LLM's approach to user questions. For example, in the role of an army Sergeant, LLM may respond to question about current time as something like, "The current time is 08:01 AM EDT.", while a comedian who always tells a one-liner joke about my question may respond something like, "It's time for you to get a watch! Just kidding, it is currently 8:01 AM on October 7th, 2023 in the Eastern Daylight Time (EDT) timezone.".|-|
|`personality`|O|Gives a personality to the tone of LLM's response.|-|
|`language`|O|The language you want the agent to respond in irrespective of the language the user question is asked in. Default=English.|-|
|`expert_at`|O|If LLM should assume they are experts in any specific area, such as healthcare or automobile engines, etc.|-|
|`max_words`|O|Control how long or short should LLM's response be within. Default is less than 200 words.|Any number between 1 and 200|


### 5.2. Data Configuration

Below are currently supported data configuration parameters. Add these fields under the `dataConfig` object.

|**Parameter**|**Mandatory(M) / Optional(O)**|**Purpose**|**Possible values**|
|----------|:----------:|----------|----------|
|`max_records`|M|Controls how many top records from a result-set obtained from real-time API call should be retailed. This parameter is essential to control the input token size as results from the API call are used in grounding. **Note**: Because only top X rows are retained, it is best to provide API endpoints that would include data sorted in descending order. Default=10|Any number between 1 and 10|
|`additional_context`|O|Additional context can be provided when follow-up-like capabiltiies are expected. (see examples from 6.3. Generation of LLM response with grounding real-time data).|Must be an array with the structure as follows: ```[{ "question": "", "response_summary": "", "entities": { ... } }, { ... }]```|
|`max_contexts`|O|Retains latest X contexts. AI-Dapter will retain the last two elements of the `additional_context` array, assuming the latest context is always appended at the end of this array.|1 or 2|


## 6. AI-Dapter Methods

AI-Dapter provides three capabilities as follows and, therefore, three methods to access these capabilities.

> **Recommendation:** For the best developer experience, see 6.3. Generation of LLM response with grounding real-time data


### 6.1. Identification of real-time data sources

```js
AIDapter.getRealtimeSources(input: string, apiRepository: Types.APIRepository[]): Promise<unknown>
```

#### Purpose:

Use this method if your objective is to obtain relevant API endpoints based on user questions.

#### Inputs:

|**Parameter**|**Mandatory(M) / Optional(O)**|**Purpose**|**Data Type**|
|----------|:----------:|----------|----------|
|`input`|M|User question|Text|
|`apiRepository[]`|M|Provide a complete API repository that would contain details about the API endpoint (method, url, headers, and data), placeholders used in the API endpoint along with validation instructions which LLM will use.|See 7. API Repository|

#### Output:

|**Field**|**Purpose**|
|----------|----------|
|`api_endpoints[]`| array of all identified API endpoints.|
|`provider`|Indicates which LLM provider was used.|
|`runtime`|To track overall response time. Note that this will depend on LLM's API response time.|

#### Example

```js
// Import and initialize AI-Dapter
import AIDapter from "ai-adapter";

const ai = new AIDapter({
  "provider": "GoogleAI",
  "authentication": {
    "api_key": "<<Your API Key>>"
  }
});

// Define the API repository from where an appropriate API will be identified, updated and returned.
// Notice this example provides only one example of an API endpoint, but since this is an array, you should expect to provide multiple such API endpoints.
const apiRepository = [
  {
    "api_info": {
      "title": "Current time",
      "description": "Identify the appropriate Timezone area and location for a given location and get time at that location."
    },
    "api_endpoint": {
      "method": "GET",
      "url": "http://worldtimeapi.org/api/timezone/|area_location|",
      "headers": {
        "Content-Type": "application/json"
      }
    },
    "placeholders": [
      {
        "placeholder": "|area_location|",
        "validation_criteria": "An example of area_location is: America/New_York or Europe/London. Based on the valid location provided, determine appropriate area_location.",
        "default": "America/New_York"
      }
    ]
  }
];

// This is the user's question
let input = "what time is it in Mumbai?"

// Now call the getRealtimeSources() method to obtain valid API endpoints
ai.getRealtimeSources(input, apiRepository)
  .then((resp) => {
    console.log(resp);
    /*
    {
      "api_endpoints": [
        {
          "api": {
            "method": "GET",
            "url": "https://worldtimeapi.org/api/timezone/Asia/Kolkata",
            "headers": {
              "Content-Type": "application/json"
            }
          },
          "placeholders": [
            {
              "placeholder": "[area_location]",
              "determined": true
            }
          ],
          "status": "OK"
        }
      ],
      "provider": "GoogleAI",
      "runtime": "2 seconds"
    }
    */
  }).catch((err) => console.log(JSON.stringify(err, null, 4)));
```

#### Result:

Notice that based on the user-provided city as **Mumbai**, LLM determined the appropriate value for placeholder **area_location** and returned an updated API endpoint.


### 6.2. Acquisition of real-time data

```js
AIDapter.getDataFromRealtimeSource(input: string, apiRepository: Types.APIRepository[], dataConfig?: Types.DataConfig | undefined): Promise<unknown>
```

#### Purpose:

Use this method if your objective is to obtain data from relevant API endpoints based on user questions.

#### Inputs:

|**Parameter**|**Mandatory(M) / Optional(O)**|**Purpose**|**Data Type**|
|----------|:----------:|----------|----------|
|`input`|M|User question|Text|
|`apiRepository[]`|M|Array of API information, endpoints (method, url, headers, and data), and placeholders.|See 7. API Repository|
|`dataConfig`|O|Configuration paramters to control data obtained from API calls.|See 5.2. Data Configuration|

#### Output:

|**Field**|**Purpose**|
|----------|----------|
|`api_results[]`|Array of responses from all API calls.|
|`provider`|Indicates which LLM provider was used.|
|`runtime`|To track overall response time. Note that this will depend on LLM's API response time.|

#### Example

```js
// Import and initialize AI-Dapter
import AIDapter from "ai-adapter";

const ai = new AIDapter({
  "provider": "GoogleAI",
  "authentication": {
    "api_key": "<<Your API Key>>"
  }
});

// Define the API repository from where an appropriate API will be identified, updated and returned.
// Notice this example provides only one example of an API endpoint, but since this is an array, you should expect to provide multiple such API endpoints.
const apiRepository = [
  {
    "api_info": {
      "title": "Current time",
      "description": "Identify the appropriate Timezone area and location for a given location and get time at that location."
    },
    "api_endpoint": {
      "method": "GET",
      "url": "http://worldtimeapi.org/api/timezone/|area_location|",
      "headers": {
        "Content-Type": "application/json"
      }
    },
    "placeholders": [
      {
        "placeholder": "|area_location|",
        "validation_criteria": "An example of area_location is: America/New_York or Europe/London. Based on the valid location provided, determine appropriate area_location.",
        "default": "America/New_York"
      }
    ]
  }
];

// This is the user's question
let input = "what time is it in Mumbai?"

// Data configuration
let dataConfig = { "max_records": 3 }

// Now call the getDataFromRealtimeSource() method to obtain data from calling all relevant API endpoints based on user question
ai.getDataFromRealtimeSource(question, apiRepository, dataConfig)
  .then((resp) => {
    console.log(resp);
    /*
    {
      "api_results": [
        {
          "api_sources": "worldtimeapi.org",
          "data": {
            "abbreviation": "IST",
            "client_ip": "50.126.214.61",
            "datetime": "2024-01-05T22:48:30.316887+05:30",
            "day_of_week": 5,
            "day_of_year": 5,
            "dst": false,
            "dst_from": null,
            "dst_offset": 0,
            "dst_until": null,
            "raw_offset": 19800,
            "timezone": "Asia/Kolkata",
            "unixtime": 1704475110,
            "utc_datetime": "2024-01-05T17:18:30.316887+00:00",
            "utc_offset": "+05:30",
            "week_number": 1
          }
        }
      ],
      "provider": "GoogleAI",
      "runtime": "4 seconds"
    }
    */
  }).catch((err) => console.log(JSON.stringify(err, null, 4)));
```

#### Result:

Response from the API call. This data can be used for LLM grounding.


### 6.3. Generation of LLM response with grounding real-time data

```js
AIDapter.getLLMResponseFromRealtimeSources(input: string, apiRepository: Types.APIRepository[], options?: AIDapterOptions | undefined): Promise<unknown>
```

#### Purpose:

Use this method if your objective is to obtain LLM responses based on user questions. This includes identifying relevant API endpoints, calling the identified APIs, and using that in the LLM prompt to receive the response from LLM. 

> **Recommendation:** Use this method to achieve maximum acceleration in your application development process.

#### Inputs:

|**Parameter**|**Mandatory(M) / Optional(O)**|**Purpose**|**Data Type**|
|----------|:----------:|----------|----------|
|`input`|M|User question|Text|
|`apiRepository[]`|M|Array of API information, endpoints (method, url, headers, and data), and placeholders.|See 7. API Repository|
|`options`|O|Agent and Data Configuration|See 5. Agent & Data Configuration Options|

#### Output:

|**Field**|**Purpose**|
|----------|----------|
|`ai_response`|LLM generated response.|
|`ai_status`|Helps determine if the response was based on the availability of all required data elements to make successful API calls. Possible values: OK, FOLLOW-UP, or INCOMPLETE|
|`ai_context`|This contains a short response summary and a list of entities. The idea behind this field is for use cases involving follow-up conversations. The entire object can be passed as `additional_content` within the `dataConfig` options when follow-up questions are to be submitted.|
|`provider`|Indicates which LLM provider was used.|
|`runtime`|To track overall response time. Note that this will depend on LLM's API response time.|

#### Example

```js
// Import and initialize AI-Dapter
import AIDapter from "ai-adapter";

const ai = new AIDapter({
  "provider": "GoogleAI",
  "authentication": {
    "api_key": "<<Your API Key>>"
  }
});

// Define the API repository from where an appropriate API will be identified, updated and returned.
// Notice this example provides only one example of an API endpoint, but since this is an array, you should expect to provide multiple such API endpoints.
const apiRepository = [
  {
    "api_info": {
      "title": "Current time",
      "description": "Identify the appropriate Timezone area and location for a given location and get time at that location."
    },
    "api_endpoint": {
      "method": "GET",
      "url": "http://worldtimeapi.org/api/timezone/|area_location|",
      "headers": {
        "Content-Type": "application/json"
      }
    },
    "placeholders": [
      {
        "placeholder": "|area_location|",
        "validation_criteria": "An example of area_location is: America/New_York or Europe/London. Based on the valid location provided, determine appropriate area_location.",
        "default": "America/New_York"
      }
    ]
  }
];

// This is the user's question
let input = "what time is it in Mumbai?"

// AI-Dapter options which provide combined Agent configuration and Data Configuration
let options: AIDapterOptions = {
  "agentConfig": { "role": "comedian who always tells a one-liner joke about my question" },
  "dataConfig": { "max_records": 7 }
};

// Now call the getLLMResponseFromRealtimeSources() method to obtain an LLM response to the user question.
// LLM response is based on a prompt that uses real-time data for grounding.
ai.getLLMResponseFromRealtimeSources(question, apiRepository, options)
  .then((resp) => {
    console.log(resp);
    /*
    {
      "ai_response": "In the vibrant city of Mumbai, where Bollywood dreams take flight and the aroma of street food fills the air, it's currently 22:50 on this fabulous Friday, the 5th of January, 2024. So, whether you're sipping chai at the Gateway of India or grooving to the beats in a local dance club, remember, time waits for no one, not even for the biggest Bollywood stars!",
      "ai_status": "OK",
      "ai_context": {
        "questions": "what time is it in Mumbai? What is the current date in Mumbai?",
        "entities": [],
        "data": [
          {
            "abbreviation": "IST",
            "client_ip": "50.126.214.61",
            "datetime": "2024-01-05T22:50:51.261990+05:30",
            "day_of_week": 5,
            "day_of_year": 5,
            "dst": false,
            "dst_from": null,
            "dst_offset": 0,
            "dst_until": null,
            "raw_offset": 19800,
            "timezone": "Asia/Kolkata",
            "unixtime": 1704475251,
            "utc_datetime": "2024-01-05T17:20:51.261990+00:00",
            "utc_offset": "+05:30",
            "week_number": 1
          }
        ],
        "sources": [
          "worldtimeapi.org"
        ]
      },
      "provider": "GoogleAI",
      "runtime": "6 seconds"
    }
    */
  }).catch((err) => console.log(JSON.stringify(err, null, 4)));
```

#### Result:

Notice that the user question is used first to identify relevant API from the provided API repository. This method also calls the identified APIs, collects their responses to ground the final LLM prompt, and returns the generated response.

### 6.4. Memory/Context for follow-up

Also, Note that the response contains the LLM-generated content within the `ai_response` field and context within the `ai_context` field. The entire context can be passed as `dataConfig.additional_context` along with follow-up questions.

An example shows how the context can be passed to enable follow-up conversations.

```js

// As shown in the previous example, ai_context contains the following information:
// -----------------------------------------------------------------------------
//  resp.ai_context: {
//   "questions": "what time is it in Mumbai? What is the current date in Mumbai?",
//   "entities": [],
//   "data": [
//     {
//       "abbreviation": "IST",
//       "client_ip": "50.126.214.61",
//       "datetime": "2024-01-05T22:50:51.261990+05:30",
//       "day_of_week": 5,
//       "day_of_year": 5,
//       "dst": false,
//       "dst_from": null,
//       "dst_offset": 0,
//       "dst_until": null,
//       "raw_offset": 19800,
//       "timezone": "Asia/Kolkata",
//       "unixtime": 1704475251,
//       "utc_datetime": "2024-01-05T17:20:51.261990+00:00",
//       "utc_offset": "+05:30",
//       "week_number": 1
//     }
//   ],
//   "sources": [
//     "worldtimeapi.org"
//   ]
// }
// -----------------------------------------------------------------------------


// Append the above context into dataConfig.additional_context ...
if(options.dataConfig[additional_context]){
  options.dataConfig[additional_context].push(resp.ai_context);
}
else{
  options.dataConfig[additional_context] = [];
  options.dataConfig[additional_context].push(resp.ai_context);
}

// This is the user's follow-up question
let input = "which timezone is it in?"

// Call the getLLMResponseFromRealtimeSources() method again, 
//This time, 'options' contains additional context to help LLM generate a follow-up response.
ai.getLLMResponseFromRealtimeSources(question, apiRepository, options)
  .then((resp) => {
    console.log(resp);
    /*
    {
      "ai_response": "It's 11:02 PM in the Maximum City, better known as Mumbai, on this fine Friday, the 5th of January, 2024. The city of dreams is currently in the Indian Standard Time (IST) zone, which is 5 hours and 30 minutes ahead of Coordinated Universal Time (UTC). So, if you're planning to call your buddy in London, remember the time difference or you might end up waking them up in the middle of the night. On a lighter note, if you're ever lost in Mumbai, just ask for directions to CST - the city's iconic train station. It's like the Times Square of Mumbai, but with more trains and less Spider-Man. Enjoy your stay in Mumbai, the city that never sleeps, unless it's past midnight, of course!",
      "ai_status": "OK",
      "ai_context": {
        "questions": "what time is it in Mumbai? What is the current date in Mumbai? which timezone is it in? What is the local time in Mumbai?",
        "entities": [],
        "data": [
          {
            "abbreviation": "IST",
            "client_ip": "50.126.214.61",
            "datetime": "2024-01-05T23:02:39.506038+05:30",
            "day_of_week": 5,
            "day_of_year": 5,
            "dst": false,
            "dst_from": null,
            "dst_offset": 0,
            "dst_until": null,
            "raw_offset": 19800,
            "timezone": "Asia/Kolkata",
            "unixtime": 1704475959,
            "utc_datetime": "2024-01-05T17:32:39.506038+00:00",
            "utc_offset": "+05:30",
            "week_number": 1
          }
        ],
        "sources": [
          "worldtimeapi.org"
        ]
      },
      "provider": "GoogleAI",
      "runtime": "10 seconds"
    }
    */
  }).catch((err) => console.log(JSON.stringify(err, null, 4)));
```

#### Follow-up Result:

The reference to "it" is obtained from the `additional_context`.

Thus, the method `getLLMResponseFromRealtimeSources()` is an **all-in-one method**, and an actual black box that can accelerate AI-based application development experience.

#### Additional purpose of the additional context:

To instill reliability and openness (a.k.a. trust) in applications built using Generative AI technologies, it is crucial to be able to do a couple of things listed below. `additional_context` provides components to build such trusted system.

- Source of information / data.
- Actual dataset that was used to generate contextual result.
- Understand the actual question(s) being answered; especially relevant with [deep-dive prompting technique](https://mangeshpise.medium.com/deep-dive-prompting-technique-to-improve-the-quality-of-llms-response-233f3728223e) that aims to improve quality and completeness of response.
- Improve ability to test / debug the system.
- etc.

## 7. API Repository

The API repository is a structure (basically, an array of API endpoints and additional metadata) that AI-Dapter uses to increase accuracy<sup>*</sup> and deliberation in the process of identifying appropriate APIs based on user questions.

The API repository must be a developer-provided asset because:

- applications that must rely on specific data sources (such as a company's APIs) can be made available to LLM models for grounding,
- APIs that rely on user identification for metering, telemetry, and access can be exposed to LLM while ensuring security, metering, and telemetry,
- the specific structure of the API repository also allows LLM to take hints and re-write the API endpoints using the context from the user's question, 

... and last but not least,

- providing specific API versions, as APIs change through their lifecycle management, becomes possible by making the API repository a part of AI-Dapter's configuration.

> <sup>*</sup> While it is difficult to ensure 100% accuracy in any AI model, the term 'accuracy' here means better confidence in results obtained from the use of LLM and levers provided by some models, such as temperature, sampling, etc. to generate a response on a spectrum between more deterministic and more random nature of the output.


### 7.1. API Repository Structure

As mentioned earlier, an API repository is an array of API endpoints and additional metadata. The structure comprises three parts, as shown in the example below.

Note that the developer must provide an API repository (using this exact structure). We do not rely on standard APIs for various reasons, such as security & billing, concise repository payload, flexibility, etc.

```json
[
  {
    "api_info": {
      "title": "Current time",
      "description": "Identify the appropriate Timezone area and location for a given location and get time at that location."
    },
    "api_endpoint": {
      "method": "GET",
      "url": "http://worldtimeapi.org/api/timezone/|area_location|",
      "headers": {
        "Content-Type": "application/json"
      }
    },
    "placeholders": [
      {
        "placeholder": "|area_location|",
        "validation_criteria": "An example of area_location is: America/New_York or Europe/London. Based on the valid location provided, determine appropriate area_location.",
        "default": "America/New_York"
      }
    ]
  },

  /** add more API endpoints **/

]
```

#### Part 1: API Information 

Type: Object

|**Parameter**|**Mandatory(M) / Optional(O)**|**Purpose**|
|----------|:----------:|----------|
|`api_info`|M|Describes the purpose of the API and conditions under which it must be selected.|
|`api_info.title`|M|Short description about the API|
|`api_info.description`|M|Use this to describe the purpose of the API in detail. Also, provide hints for LLM to help understand under which condition this API must be selected.|


#### Part 2: API Endpoint 

Type: Object

|**Parameter**|**Mandatory(M) / Optional(O)**|**Purpose**|
|----------|:----------:|----------|
|`api_endpoint`|M|HTTP Request elements will be re-written and served back as callable API endpoints.|
|`api_endpoint.method`|M|Methods such as GET, POST, PUT, DELETE.|
|`api_endpoint.url`|M|API web address with placeholders between '\|' symbols. **Example:** http://worldtimeapi.org/api/timezone/**\|area_location\|**, where `|area_location|` is the placeholder.|
|`api_endpoint.headers`|O|HTTP headers, such as 'Content-Type' or any other headers the API requires, such as 'X-API-KEY'. Placeholders can be used in headers as well.|
|`api_endpoint.data`|O|If an API requires data (typically with POST methods), it can be supplied here. Placeholders can be used here as well. **Note:** For key-value pair-based data, all keys of the data object must be specified, and placeholders can be used for values.|


#### Part 3: API Placeholders 

Type: Array

|**Parameter**|**Mandatory(M) / Optional(O)**|**Purpose**|
|----------|:----------:|----------|
|`placeholders`|M|Placeholders are replaced during the API identification process.|
|`placeholders.placeholder`|M|Provide the name of the placeholder that would be used in any part of the `api_endpoint`. This is the placeholder name, such as **\|area_location\|**.|
|`placeholders.validation_criteria`|M|Provide instructions on validating if an appropriate value determined during the API identification and re-writing process is correct. **Note:** Developers may need to try different instructions during testing to improve accuracy.|
|`placeholders.default`|O|If any value cannot be determined, provide instructions on any default value that must be assumed.|


## 8. Current Limitations

AI-Dapter currently does not support API calls that require OAuth-based authentication. Only direct API calls, such as those with API Keys or unsecured API, are supported.


## 9. About the Developer

Mangesh Pise | [Web](https://mangeshpise.com/home) | [LinkedIn](https://www.linkedin.com/in/mangeshpise) | is a software and Enterprise Architect. 

During his work with LLM, he realized the general lack of a framework that allowed LLM to be aware of "real-time" information. The question was how to build an orchestration framework to identify API endpoints, call them to extract real-time data, and then use the API responses to ground LLM prompts. Further, he realized the API endpoints could be private (within an enterprise) and public (like openweathermap.org). 

With the depth of experience in application development (full-stack) and prompt engineering (with LLMs), he had to develop a concept that could accelerate the application development process for applications involving LLMs. He realized the skills differ for application developers from those for prompt engineering. 

Thus, AI-Dapter was conceptualized, which can be used as a black box by full-stack application developers without spending time and effort on complex prompt engineering and orchestration processes for obtaining real-time data.


## 10. Demonstrations

Watch the full demonstration with setup and examples on [YouTube](https://youtu.be/x2RuLgX3J9c).

Check out the demo project on [GitHub](https://github.com/mppise/ai-dapter-demo) for a practical look at AI-Dapter in action. Just clone and update your OpenAI API keys and Org ID.

