# twilio-dialogflow-bridge

AWS Lambda-based gateway between Twilio &amp; Dialogflow

## Steps to operation

- Add the webhook to the Twilio dashboard using POST and the url for the lambda function, which will look like this `https://lots-of-characters-here.amazonaws.com/latest/bridge` (note you need to add the `bridge` part). 

### Deployment

Initially deployed to my AWS account using:

```
./node_modules/.bin/claudia create --region us-east-1 --api-module lambda --role party-bot-executor --memory 512 --timeout 20
```

Subsequent updates:

```
./node_modules/.bin/claudia update
```