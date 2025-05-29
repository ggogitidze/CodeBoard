const axios = require('axios');

exports.handler = async function(event, context) {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const body = JSON.parse(event.body);
    const { language, version, files, stdin, args, compile_timeout, run_timeout, compile_memory_limit, run_memory_limit } = body;

    const response = await axios.post('https://emkc.org/api/v2/piston/execute', {
      language,
      version,
      files,
      stdin,
      args,
      compile_timeout,
      run_timeout,
      compile_memory_limit,
      run_memory_limit
    });

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type'
      },
      body: JSON.stringify(response.data)
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: error.message, 
        details: error.response?.data 
      })
    };
  }
}; 