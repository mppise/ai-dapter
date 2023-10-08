![AI-Dapter](./res/AI-Dapter_Logo_528x132.png)

# AI-Dapter

Adapter to connect AI LLM with realtime grounding sources and data


## 1. Concept

As multi-modal artificial intelligence models, LLMs have a wide applicability for generating content with minimal intructions. Prompting techniques such as one-shot or few-shot are pretty poplular amongst every day users of chat applications built on top of such LLMs. That said, although the quality of response is great, how much can we trust it? How do we know the model isn't "making up" (a.k.a. hallucinating) on-the-fly.

As a result, [**grounding**](https://techcommunity.microsoft.com/t5/fasttrack-for-azure/grounding-llms/ba-p/3843857) LLMs by providing contextual data in combination with right prompting techniques is very important. This is different than training and is most effectively achieved by using prompts with grounded information as context to help LLM geenrate a better response; one that can be more trusted. 

One such approach is called Retrieval-Augmented Generation (RAG) which relies on storing and searching text-embeddings, which is provided to LLM along with the prompt. However, RAG relies on static information converted into text-embeddings and storing them into graph databases (a.k.a. vector databases) so that relevant information can be *retrieved* from it and *augmented* via grounding to *generate* text / response.

This opens up the question that whether realtime information can be used with LLMs to generate effective and reliable responses? The simple answer is, *"Of course, yes!"*. But that means a lot more responsibilities on the shoulders of Application Developers. The developer needs to call the API, wrap the response within a prompt to have LLM generate a relevant response. But will calling the same API over and over for every question work? - Most probably not! So, how can we dynamically determine which API should be called and which parameters must be passed based on the question? Well, that also sounds like a capability for LLM.

This is where AI-Dapter (read as, *AI Adapter*) comes into play. AI-Dapter accelerates LLM-based application development process for developers, while allowing them to only focus on applicaton while offloading the burden of following activities to LLM.

- **identifying** the right API endpoints from a pre-defined API repository,
- **acquiring** realtime data from the identified API endpoints, and 
- **generating** a response using LLM model of choice.


## 2. Developer Experience

The developer experience is improved tremendously by plugging-in the AI-Dapter framework within the application code and seamlessly using it as a [**black box**](https://en.wikipedia.org/wiki/Black_box) to perform LLM-based responses to user's questions. Note that these user questions themselves might be close to a one-shot prompt! 

The actual work behind this black box includes:

- ability to integrate an LLM model of your choice with your credentials (_Note:_ *Currently only OpenAI GPT models are supported*),
- an integrated engine that leverages user inputs to perform identification of -
    - API-based data-sources, 
    - acquisition of realtime data from those API's, and 
    - generation of response grounded by realtime data using LLM.


## 3. Installation

To install AI-Dapter for your NodeJS project, run the following on command-line. Make sure you are within your project's root directory.

```bash
npm install ai-dapter --save
```


## 4. Setup and Initialization

### 4.1. Importing AI-Dapter

Assuming you have setup a typescript NodeJS project, import AIDapter class as follows.

```js
import AIDapter from "ai-dapter";
```


### 4.2. Initialize the setup

To initialize AI-Dapter, you will need to pass some mandatory and some optional parameters to complete the setup. An example is shown below followed by documentation of the supported parameters.

```js
const ai = new AIDapter({
  "provider": "OpenAI",
  "model_name": "gpt-3.5-turbo-16k",
  "endpoint": "https://api.openai.com/v1/chat/completions",
  "authentication": {
    "api_key": "<<Your OPENAI Key>>",
    "org_id": "<<Your OPENAI Org ID>>"
  }
});
```

List of supported parameters to initialize the setup.

|**Parameter**|**Mandatory(M) / Optional(O)**|**Purpose**|**Possible values**|
|----------|:----------:|----------|----------|
|`provider`|M|The provider of LLM Model. _Note_: at this point, only models provided directly by OpenAI are supported.|"OpenAI"|
|`model_name`|M|Allows you to select any model released by the provider. We recommend using models that allow large token sizes, such as `gpt-3.5-turbo-16k`.|-|
|`endpoint`|M|The endpoint from where the LLM model is served by the provider. You may have to refer to provider-specific documentation. For example, OpenAI chat completion model is serverd from `https://api.openai.com/v1/chat/completions` endpoint.|-|
|`authentication`|M|Provide authentication details as specified by your provider. For example, since OpenAI requires an API Key and an Organization ID, those are provided under fields `api_key` and `org_id` fields as shown in the initialization example above|-|


## 5. Agent & Data Configuration Options

AI-Dapter allows you to customize specific agent configurations, such as adding role, personality, etc. On the same lines, you can also customize specific data configurations, such as controlling number of records from realtime API responses, passing additional context or grounding information to simulate follow-ups, etc. 

Both the agent and configuration options are passed as single object as follows. Refer to the appropriate sections below to lookup and adjust these configuration values.

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
|`role`|M|Helps guide LLM's behavior in approaching user question. For example, in the role of an army Sergeant, LLM may respond to question about current time as something like, "The current time is 08:01 AM EDT.", while a comedian who always tells a one-liner joke about my question may respond something like, "It's time for you to get a watch! Just kidding, it is currently 8:01 AM on October 7th, 2023 in the Eastern Daylight Time (EDT) timezone.".|-|
|`personality`|O|Gives a personality to the tone of LLM's response.|-|
|`expert_at`|O|If LLM should assume they are expert in any specific area, such as healthcare or automobile engines, etc.|-|
|`max_words`|O|Control how long or short should LLM's response be within. Default is less than 200 words.|Any number between 1 and 200|


### 5.2. Data Configuration

Below are currently supported data configuration parameters. Add these fields under the `dataConfig` object.

|**Parameter**|**Mandatory(M) / Optional(O)**|**Purpose**|**Possible values**|
|----------|:----------:|----------|----------|
|`max_records`|M|Controls how many top records from a result-set obtained from realtime API call should be retailed. This parameter is essential to control the input token size as results from the API call are used in grounding. **Note**: Because only top X rows are retained, it is best idea to provide API endpoints that would include data sorted in descending order. Default=10|Any number between 1 and 10|
|`additional_context`|O|If, in addition to context obtained from API calls needs to be provided, such additional context can be provided here as a JSON object. This is specifically useful when providing follow-up-like capabiltiies (see more on this in examples below).|Must be an array of any type, e.g. ```["this is additional context", {"fruit_name": "apple", "red":true }, ...]```|
|`max_contexts`|O|Retains latest X contexts. AI-Dapter will retain last 2 elements of the `additional_context` array assuming latest context is always appended at the end of this array.|1 or 2|


## 6. AI-Dapter Methods

AI-Dapter provides 3 capbilities as follows, and therefore provides 3 methods to access these capabilities.

> **Recommendation:** For best developer experience, see 6.3. Generation of LLM response with grounding realtime data


### 6.1. Identification of realtime data sources

```js
AIDapter.getRealtimeSources(input: string, apiRepository: Types.APIRepository[]): Promise<unknown>
```

#### Purpose:

Use this method if your objective is to obtain relevant API endpoints based on user question.

#### Inputs:

|**Parameter**|**Mandatory(M) / Optional(O)**|**Purpose**|**Data Type**|
|----------|:----------:|----------|----------|
|`input`|M|User question|Text|
|`apiRepository[]`|M|Provide complete API repository which would contain details about API endpoint (method, url, headers, and data), placeholders used in the API endpoint along with validation instructions which LLM will use.|See 7. API Repository|

#### Output:

|**Field**|**Purpose**|
|----------|----------|
|`api_endpoints[]`|Array of all identified API endpoints.|
|`tokens`|To track LLM tokens used.|

#### Example

```js
// Import and initialize AI-Dapter
import AIDapter from "ai-dapter";

const ai = new AIDapter({
  "provider": "OpenAI",
  "model_name": "gpt-3.5-turbo-16k",
  "endpoint": "https://api.openai.com/v1/chat/completions",
  "authentication": {
    "api_key": "<<Your API Key>>",
    "org_id": "<<Your Org ID>>"
  }
});

// Define the API repository from where an appropriate API will be identified, updated and returned.
// Notice this example provides only one example of an API endpoint, but since this is an array, you should expect to provide multiple such API endpoints.
const apiRepository = [
  {
    "api_info": {
      "title": "Current time",
      "description": "Identify the appropriate Timezone area and location for a given location and get time at that location"
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

// This is user's question
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
            "url": "http://worldtimeapi.org/api/timezone/Asia/Kolkata",
            "headers": {
              "Content-Type": "application/json"
            }
          },
          "placeholders": [
            {
              "placeholder": "|area_location|",
              "determined": true
            }
          ],
          "status": "OK"
        }
      ],
        "tokens": {
        "prompt_tokens": 1974,
          "completion_tokens": 98,
            "total_tokens": 2072
      }
    } 
    */
  }).catch((err) => console.log(JSON.stringify(err, null, 4)));
```

#### Result:

Notice that based on user-provided city as **Mumbai**, LLM determined appropriate value for placeholder **area_location** and returned an updated API endpoint.


### 6.2. Acquisition of realtime data

```js
AIDapter.getDataFromRealtimeSource(input: string, apiRepository: Types.APIRepository[], dataConfig?: Types.DataConfig | undefined): Promise<unknown>
```

#### Purpose:

Use this method if your objective is to obtain data from relevant API endpoints based on user question.

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
|`tokens`|To track LLM tokens used.|

#### Example

```js
// Import and initialize AI-Dapter
import AIDapter from "ai-dapter";

const ai = new AIDapter({
  "provider": "OpenAI",
  "model_name": "gpt-3.5-turbo-16k",
  "endpoint": "https://api.openai.com/v1/chat/completions",
  "authentication": {
    "api_key": "<<Your API Key>>",
    "org_id": "<<Your Org ID>>"
  }
});

// Define the API repository from where an appropriate API will be identified, updated and returned.
// Notice this example provides only one example of an API endpoint, but since this is an array, you should expect to provide multiple such API endpoints.
const apiRepository = [
  {
    "api_info": {
      "title": "Current time",
      "description": "Identify the appropriate Timezone area and location for a given location and get time at that location"
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

// This is user's question
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
          "abbreviation": "IST",
          "client_ip": "2600:1009:b154:a1ec:a46d:32f6:6495:4d6e",
          "datetime": "2023-10-08T02:48:30.928315+05:30",
          "day_of_week": 0,
          "day_of_year": 281,
          "dst": false,
          "dst_from": null,
          "dst_offset": 0,
          "dst_until": null,
          "raw_offset": 19800,
          "timezone": "Asia/Kolkata",
          "unixtime": 1696713510,
          "utc_datetime": "2023-10-07T21:18:30.928315+00:00",
          "utc_offset": "+05:30",
          "week_number": 40
        }
      ],
        "tokens": {
        "prompt_tokens": 1980,
          "completion_tokens": 98,
            "total_tokens": 2078
      }
    }
    */
  }).catch((err) => console.log(JSON.stringify(err, null, 4)));
```

#### Result:

Response from API call. This data can be used for LLM grounding.


### 6.3. Generation of LLM response with grounding realtime data

```js
AIDapter.getLLMResponseFromRealtimeSources(input: string, apiRepository: Types.APIRepository[], options?: AIDapterOptions | undefined): Promise<unknown>
```

#### Purpose:

Use this method if your objective is to obtain LLM response based on user question. This includes identifying revelant API endpoints as well as calling the identified API's and using that in LLM prompt to receive the response from LLM. 

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
|`ai_response`|LLM generated response in markdown formatting.|
|`ai_status`|Helps determine if the response was based on availability of all required data elements to make successful API calls. Possible values: OK, FOLLOW-UP, or INCOMPLETE|
|`ai_context`|This contains short response summary and list of entities. The idea behind this field is that for use cases involing follow-up conversations, this entire object can be passed as `additional_content` within the `dataConfig` options.|
|`tokens`|To track LLM tokens used.|

#### Example

```js
// Import and initialize AI-Dapter
import AIDapter from "ai-dapter";

const ai = new AIDapter({
  "provider": "OpenAI",
  "model_name": "gpt-3.5-turbo-16k",
  "endpoint": "https://api.openai.com/v1/chat/completions",
  "authentication": {
    "api_key": "<<Your API Key>>",
    "org_id": "<<Your Org ID>>"
  }
});

// Define the API repository from where an appropriate API will be identified, updated and returned.
// Notice this example provides only one example of an API endpoint, but since this is an array, you should expect to provide multiple such API endpoints.
const apiRepository = [
  {
    "api_info": {
      "title": "Current time",
      "description": "Identify the appropriate Timezone area and location for a given location and get time at that location"
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

// This is user's question
let input = "what time is it in Mumbai?"

// AI-Dapter options which provide combined Agent configuration and Data Configuration
let options: AIDapterOptions = {
  "agentConfig": { "role": "comedian who always tells a one-liner joke about my question" },
  "dataConfig": { "max_records": 7 }
};

// Now call the getLLMResponseFromRealtimeSources() method to obtain LLM response to the user question.
// LLM response is based on a prompt that uses realtime data for grounding.
ai.getLLMResponseFromRealtimeSources(question, apiRepository, options)
  .then((resp) => {
    console.log(resp);
    /*
    {
      "ai_response": "The current time in Mumbai is 08:55 AM on October 8, 2023.",
        "ai_status": "OK",
          "ai_context": {
        "original_question": "\"what time is it in Mumbai?\"",
          "response_summary": "The current time in Mumbai is 08:55 AM on October 8, 2023.",
            "entities": {
          "Location": [
            "Mumbai"
          ]
        }
      },
      "tokens": {
        "api_identification": {
          "prompt_tokens": 2232,
            "completion_tokens": 98,
              "total_tokens": 2330
        },
        "llm_response": {
          "prompt_tokens": 441,
            "completion_tokens": 74,
              "total_tokens": 515
        },
        "prompt_tokens": 2673,
          "completion_tokens": 172,
            "total_tokens": 2845
      }
    } 
    */
  }).catch((err) => console.log(JSON.stringify(err, null, 4)));
```

#### Result:

Notice that the user question is used to first identify relevant API's from the provided API repository. This method also calls the identified API's and collects their responses to ground the final LLM prompt and returns the generated response back.

Also take note that the response not only contains the LLM generated content (`ai_response`), but also structured context (`ai_context`) which can be passed as `additional_context` into the `dataConfig` object for follow-up questions. Ideally, this is useful when follow-up questions needs to be answered and a prior context is essential to generate a meaningful response.

Here is an example showing how the context can be passed to enable follow-up conversation.

```js
// Update dataConfig object with additional_context ...
options.dataConfig.additional_context = [
  {
    "original_question": "\"what time is it in Mumbai?\"",
    "response_summary": "The current time in Mumbai is 08:55 AM on October 8, 2023.",
    "entities": {
      "Location": ["Mumbai"]
    }
  }
];

// This is user's follow-up question
let input = "which timezone is it in?"

// ... and call the getLLMResponseFromRealtimeSources() method again.
// This enables LLM to take the additional context into account and generate a follow-up response.
ai.getLLMResponseFromRealtimeSources(question, apiRepository, options)
  .then((resp) => {
    console.log(resp);
    /*
    {
      "ai_response": "The current timezone is Asia/Kolkata.",
        "ai_status": "OK",
          "ai_context": {
        "original_question": "\"which timezone is it in?\"",
          "response_summary": "The current timezone is Asia/Kolkata.",
            "entities": { }
      },
      "tokens": {
        "api_identification": {
          "prompt_tokens": 2238,
            "completion_tokens": 98,
              "total_tokens": 2336
        },
        "llm_response": {
          "prompt_tokens": 439,
            "completion_tokens": 52,
              "total_tokens": 491
        },
        "prompt_tokens": 2677,
          "completion_tokens": 150,
            "total_tokens": 2827
      }
    } 
    */
  }).catch((err) => console.log(JSON.stringify(err, null, 4)));
```

#### Follow-up Result:

The reference of "it" is obtained from the `additional_context`.

Thus, the method `getLLMResponseFromRealtimeSources()` is an **all-in-one method**, a true black box that can accelarate AI based application development experience.


## 7. API Repository

The API repository is a structure (basically, an array of API endpoints and additional metadata) that AI-Dapter uses to increase accuracy<sup>*</sup> and deliberation in the process of identifying appropriate API's based on user question.

The API repository must be a developer-provided asset because:

- applications that must rely on specific data sources (such as a company's own API's) can be made available to LLM models for grounding,
- API's that rely on user-identification for metering, telemetry, and access can be exposed to LLM while ensuring security, metering, and telemetry,
- the specific structure of the API repository also allows LLM to take hints and rewrite the API endpoints using the context from user's question, 

... and last, but not the least,

- providing specific API versions, as API's change through their own lifecycle management, becomes possible by making API repository a part of AI-Dapter's configuration.

> <sup>*</sup> While it is difficult to ensure 100% accuracy in any AI model, the term 'accuracy' here means better confidence in results obtained from use of LLM and levers provided by some models, such as temperature, sampling, etc. to generate response on a spectrum between more deterministic and more random nature of output.


### 7.1. API Repository Structure

As mentioned earlier, API repository is an array of API endpoints and additional metadata. The structure comprises of 3 parts as shown in the example below.

```json
[
  {
    "api_info": {
      "title": "Current time",
      "description": "Identify the appropriate Timezone area and location for a given location and get time at that location"
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
|`api_info.description`|M|Use this to describe the purpose of the API in detail. Also provide hints for LLM to help understand under which condition this API must be selected.|


#### Part 2: API Endpoint 

Type: Object

|**Parameter**|**Mandatory(M) / Optional(O)**|**Purpose**|
|----------|:----------:|----------|
|`api_endpoint`|M|HTTP Request elements which will be re-written and served back as callable API endpoints.|
|`api_endpoint.method`|M|Methods such as GET, POST, PUT, DELETE.|
|`api_endpoint.url`|M|API web address with placeholders between '\|' symbols. **Example:** http://worldtimeapi.org/api/timezone/**\|area_location\|**, where `|area_location|` is the placeholder.|
|`api_endpoint.headers`|O|HTTP headers, such as 'Content-Type' or any other headers that the API requires, such as 'X-API-KEY'. Placeholders can be used in headers as well.|
|`api_endpoint.data`|O|If an API requires data to be supplied (typically with POST methods), it can be supplied here. Placeholders can be used here as well. **Note:** for key-value pair based data, all key's of the data object must be specified and placeholders can be used for values.|


#### Part 3: API Placeholders 

Type: Array

|**Parameter**|**Mandatory(M) / Optional(O)**|**Purpose**|
|----------|:----------:|----------|
|`placeholders`|M|Placeholders are replaced during the API identification process.|
|`placeholders.placeholder`|M|Provide the name of the placeholder that would be used in any part of the `api_endpoint`. This is the placeholder name, such as **\|area_location\|**.|
|`placeholders.validation_criteria`|M|Provide instructions on how to validate if an appropriate value that has been determined during the API identification and re-writing process is correct. **Note:** Developers may need to try different instructions during testing to improve accuracy.|
|`placeholders.default`|O|If any value cannot be determined, provide instructions on any default value that must be assumed.|


## 8. Current Limitations

1. AI-Dapter currently does not support API calls that require OAuth-based authentication. Only direct API calls, such as those with API Keys or unsecured API's are supported.


## 9. About the Developer

Mangesh Pise | [Web](https://mangeshpise.com/home) | [LinkedIn](https://www.linkedin.com/in/mangeshpise) | is a software and Enterprise Architect. 

During his work with LLM's, he realized the general lack of a framework that allowed LLM's to be aware of "realtime" information. The question was how to build an orchestration framework that can identify API endpoints, call them to extract realtime data, and then use the API responses to ground LLM prompts? Further, he realized the API endpoints could be private (whithin an enterprise) as well as public (like openweathermap.org). 

With the depth of experience in application development (full-stack) and prompt engineering (with LLM's), he had to come up with a concept that can accelerate the whole application development process for applications involving use of LLM's. He realized the skills are different for application developers from those for prompt engineering. 

And so, AI-Dapter was conceptualized which can be used a black box by full-stack application developers without the need to spend time and effort on complex prompt engineering and orchestration process for obtaining realtime data.
