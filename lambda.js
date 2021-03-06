

// Dialogflow setup
const dialogflow = require('@google-cloud/dialogflow')
const lambda_runtime_directory = '/var/task/'
const jsonToProto = require('./lib/json_to_proto')

// Twilio setup
const MessagingResponse = require('twilio').twiml.MessagingResponse;

// API builder setup
var ApiBuilder = require('claudia-api-builder');
var api = new ApiBuilder();
module.exports = api;

// Get the list of bots
const fs = require('fs')
let rawdata = fs.readFileSync('secrets/active_bots.json');
let bot_list = JSON.parse(rawdata)

// code executed for each call to the lambda function
api.post('/bridge', async function(req){
    
    // from Twilio
    const data = req.post
    var text = data.Body
    const twilio_id = data.From
    const bot_number = data.To
    const num_media = parseInt(data.NumMedia, 10)
    
    // Bail if we didn't get a message directed to a known bot phone no
    if (!Object.keys(bot_list).includes(bot_number)) {
        console.log(`No match for '${bot_number}' in active bots file. Aborting.`)
        console.log("bot_list:", bot_list)
        return false
    }
    
    // Create session client. Note that this needs to be done
    // with every new connection, so it's within the "post" and 
    // will not be kept warm by lambda from a previous request.
    // see: https://github.com/grpc/grpc-node/issues/692#issuecomment-631441230
    const bot_data = bot_list[bot_number]
    const projectId = bot_data.project_id
    const credentials_file_path = lambda_runtime_directory + `secrets/${bot_data.credentials_file}`    
    const sessionClient = new dialogflow.SessionsClient({
        projectId,
        keyFilename: credentials_file_path,
    });
    
    const sessionId = twilio_id;
    const languageCode = 'en-US';
    
    
    // pass twilio source along in the payload
    data.source = "twilio"
    
    const sessionPath = `projects/${projectId}/agent/sessions/${sessionId}`

    if (num_media > 0) {
        text += " TWILIO MEDIA OBJECT"
    }
    
    // Add a "launch-keyword-detected" context if it's a launch keyword
    const contexts = []
    var launch_keywords = ['hi', 'hello', 'hola']
    var clean_text = text.toLowerCase().trim()
    if (launch_keywords.includes(clean_text)) {
        var launch_context = [
            {
                "name": `projects/${projectId}/agent/sessions/${sessionId}/contexts/launch-keyword-detected`,
                "lifespanCount": 1
            }
        ]
        contexts.push(launch_context)
    }
    
    
    // The text query request.
    const request = {
        session: sessionPath,
        queryInput: {
            text: {
                // The query to send to the dialogflow agent
                text: text,
                // The language used by the client (en-US)
                languageCode: languageCode,
            },
        },
        queryParams :{
            payload: jsonToProto.jsonToStructProto(data)
        }
    };
    
    // add the launch context to the request, if it exists
    if (contexts && contexts.length > 0) {
        request.queryParams.contexts = jsonToProto.jsonToStructProto(contexts)
    }

    // Send sent text to Dialogflow and log result
    const responses = await sessionClient.detectIntent(request);
    const result = responses[0].queryResult;
    const sendback = result.fulfillmentText
    
    console.log(`  Query: ${result.queryText}`);
    console.log(`  Response: ${result.fulfillmentText}`);
    if (result.intent) {
        console.log(`  Intent: ${result.intent.displayName}`);
    } else {
        console.log(`  No intent matched.`);
    }

    // Reply to texter via Twilio
    const twiml = new  MessagingResponse()
    twiml.message(sendback)
    return twiml.toString()

}, {
    // this optional 3rd argument changes the format of the response, for twilio 
    success: { contentType: 'application/xml' },
    error: { contentType: 'application/xml' }
});
