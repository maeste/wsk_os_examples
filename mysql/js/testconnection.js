
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
