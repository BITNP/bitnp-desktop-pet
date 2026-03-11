import net from 'net'

export default async function fetchBackendData(value, port=10987) {
  return new Promise((resolve, reject) => {
    const requestData = {
      version: 1,
      id: `request_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      kind: 'get_info',
      payload: {
        value: value,
        addition: null
      }
    };
    
    const jsonString = JSON.stringify(requestData);
    
    // 通过 TCP socket 连接
    const client = new net.Socket();
    const PORT = port;
    
    client.connect(PORT, '127.0.0.1', () => {
      console.log('连接到后端服务，请求:', value);
      client.write(jsonString + '\n');  // 添加换行符作为结束符
    });
    
    let responseData = '';
    let timeout = setTimeout(() => {
      client.destroy();
      reject(new Error('请求超时'));
    }, 5000);
    
    client.on('data', (data) => {
      responseData += data.toString();
      
      // 假设响应是完整的 JSON
      try {
        const jsonData = JSON.parse(responseData);
        clearTimeout(timeout);
        client.destroy();
        resolve(jsonData);
      } catch (e) {
        // JSON 不完整，继续接收
      }
    });
    
    client.on('error', (err) => {
      clearTimeout(timeout);
      reject(err);
    });
    
    client.on('close', () => {
      clearTimeout(timeout);
    });
  });
}