let express =require('express');
let bodyParser = require('body-parser');
let cookieParser = require('cookie-parser');
let server = require('../main');
let request = require('request');
let services = require('../../Services/services');
let app = express();

app.use(bodyParser.json());
app.use(cookieParser());

function marshall(service) {
  let data = {};
  let allParams = [];

  data['serviceName'] = service.name;
  for(let count in service.parameters) {
    allParams.push({
      position: parseInt(count, 10) + 1,
      type: service.parameters[count]
    })
  }
  data['parameters'] = allParams;
  data['returnType'] = service.returnType;
  data['server'] = 'http://999307ab.ngrok.io';

  return data;
}

function unmarshall(data) {
  let procedure = {
    name: '',
    arguments: []
  };
  procedure.name = data.serviceName;
  data.parameters.forEach((parameter) => {
    procedure.arguments[parameter.parameterPosition - 1] = parameter.parameterValue;
  });

  return procedure;
}

function registerRPC(services) {
  services.forEach(service => {
    let marshalled_service = marshall(service);
    console.log(marshalled_service);
    let options = {
      method: 'post',
      body: marshalled_service,
      json: true,
      url: 'https://rpc-registry-server.herokuapp.com/map'
    };

    request(options, function (err, resp) {
      if (err) {
        console.log(err);
      } else {
        let data = resp.body;
        console.log('Service registered');
      }
    })
  });
}

app.post('/', function(req,res) {
  let data = req.body;
  let { name, arguments } = unmarshall(data);
  let result = server[name].apply(this, arguments);

  res.send(result.toString());
});

app.listen(5000, function(err) {
  if(!err) {
    registerRPC(services.allServices);
    console.log('Server started');
  }
});