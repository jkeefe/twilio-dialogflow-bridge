# twilio-dialogflow-bridge

AWS Lambda-based gateway between Twilio & Dialogflow

**_This documentation is a work in progress. Contact me if you're looking to use this code and need help._**

## Getting the Dialogflow credentials

In order for this bridge to work, the code needs access to the credentials file for the Dialogflow project. Here's how to get that file.

In the Dialogflow project, go to the general settings and click on the project link. (If one doesn't exist, use the options to create one.)

![](./images/step1.png)





## Code deployment

Initially deployed lambda function to my AWS account using:

```
./node_modules/.bin/claudia create --region us-east-1 --api-module lambda --role party-bot-executor --memory 512 --timeout 20
```

Subsequent updates:

```
./node_modules/.bin/claudia update
```

## Setting up Twilio

- Add the webhook to the Twilio dashboard using POST and the url for the lambda function, which will look like this `https://lots-of-characters-here.amazonaws.com/latest/bridge` (note you need to add the `bridge` part). 