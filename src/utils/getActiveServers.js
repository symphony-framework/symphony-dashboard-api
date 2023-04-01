const AWS = require('aws-sdk');

const region = process.env.REGION || 'us-east-1'
AWS.config.update({ region, });

const ecs = new AWS.ECS();

const clusterName = process.env.SERVICE_CLUSTER || 'SymPubSub';
const serviceName = process.env.SERVICE || 'SymPubSub';

const getAllTasksForService = async () => {
  console.log({clusterName, serviceName});

  try {
    const listTasksParams = {
      cluster: clusterName,
      serviceName: serviceName,
    };

    const listTasksResponse = await ecs.listTasks(listTasksParams).promise();
    const taskArns = listTasksResponse.taskArns;

    if (taskArns.length === 0) {
      console.log('No tasks found for the service.');
      return [];
    }

    const describeTasksParams = {
      cluster: clusterName,
      tasks: taskArns,
    };

    const describeTasksResponse = await ecs.describeTasks(describeTasksParams).promise();
    const tasks = describeTasksResponse.tasks;

    const privateIpAddresses = tasks.map(task => {
      const networkInterface = task.attachments.find(attachment => attachment.type === 'ElasticNetworkInterface');
      const privateIpDetail = networkInterface.details.find(detail => detail.name === 'privateIPv4Address');
      return privateIpDetail.value;
    });

    console.log({privateIpAddresses})
    return privateIpAddresses;
  } catch (error) {
    console.error('Error fetching tasks for the PubSubService', error);
    if (error.code === 'ServiceNotFoundException') return [];
    
    throw error;
  }
};

module.exports = {getAllTasksForService};