# Connectiong to mysql

One of the first concerns people have regarding serverless is they think it's just for small examples, since it's stateless and witout a container behind. The most asked question I've got is "what about a database? Where can I save results on my own database?"
This example demonstrate it's pretty simple to connect to an existing MySQL running in a different pod in your OpenShift cloud.

## prerequisite

* Openwhisk installed and working on minishift. See [parent doc](../README.md)
* Mysql installed and working on local openshift/minishift. Using the console should be straight forward, [here](https://docs.openshift.com/enterprise/3.0/using_images/db_images/mysql.html) you can find official docs though.

## write the actions
We will write a simple action, just connecting to the database and perform a simple query ```SELECT VERSION()```. Thi way we don't need to create any table or environment, but it's sufficient to demonstrate db connection works properly.
You can find it in [js/testconnection.js](js/testconnection.js)
```javascript

function myAction(params) {

  return new Promise(function(resolve, reject) {
    console.log('Connecting to MySQL database');
    var mysql = require('promise-mysql');
    console.log('module required');
    var connection;
    mysql.createConnection({
      host: params.HOSTNAME,
      port: params.PORT,
      user: params.USERNAME,
      password: params.PASSWORD,
      database: params.DATABASE
    }).then(function(conn) {
      connection = conn;
      console.log('Querying');
      var queryText = 'SELECT VERSION()';
      var result = connection.query(queryText);
      connection.end();
      return result;
    }).then(function(result) {
      console.log(result);
      if (result[0]) {
        resolve({
          statusCode: 200,
          headers: {
            'Content-Type': 'application/json'
          },
          body: result[0]
        });
      } else {
        reject({
          headers: {
            'Content-Type': 'application/json'
          },
          statusCode: 404,
          body: {
            error: "Not found."
          }
        });
      }
    }).catch(function(error) {
      if (connection && connection.end) connection.end();
      console.log(error);
      reject({
        headers: {
          'Content-Type': 'application/json'
        },
        statusCode: 500,
        body: {
          error: "Error."
        }
      });
    });
  });

}

exports.main = myAction;
```
Lets create the openwhisk package which will include our actions. We are also setting default parameters, useful for all actions included. You should put here your instance parameter. You can see it from openshift-console on your mysql's service. Note you can use address visible only from within cluster, because actions will run inside the cluster even if you are invoking them from outside.

```
wsk package create MySQL -p HOSTNAME mysql.myproject.svc -p USERNAME me -p PASSWORD me -p DATABASE fooDB
```
Now install all dependencies and package them in a zip files
```bash
cd PRJ_HOME/mysql/js
npm install
zip -r mysql.zip *
```
Finally create the actions
```bash
wsk action create MySQL/testconnection --kind nodejs:8 mysql.zip
```

And test it
```bash
wsk action invoke --result MySQL/testconnection
```
receiving the expected Output
```bash
{
    "body": {
        "VERSION()": "5.7.21"
    },
    "headers": {
        "Content-Type": "application/json"
    },
    "statusCode": 200
}

```

## TODO

* develop more actions demonstrate INSERT,UPDATE,SELECT on rela tables
* develop generic actions for INSERT, DELETE, UPDATE usable as apihost

Do you want to contribute on this? Refer to main [CONTRIBUTE](../CONTRIBUTE.md) document
