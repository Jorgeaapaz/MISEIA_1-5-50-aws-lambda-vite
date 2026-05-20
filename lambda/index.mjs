import { DynamoDBClient, PutItemCommand, UpdateItemCommand, DeleteItemCommand, ScanCommand } from "@aws-sdk/client-dynamodb";
import { randomUUID } from "crypto";

const client = new DynamoDBClient({});
const TABLE_NAME = process.env.TABLE_NAME || "tasks";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
  "Content-Type": "application/json",
};

function response(statusCode, body) {
  return { statusCode, headers: corsHeaders, body: JSON.stringify(body) };
}

export const handler = async (event) => {
  const method = event.requestContext?.http?.method ?? event.httpMethod;
  const path = event.rawPath ?? event.path ?? "/";

  if (method === "OPTIONS") {
    return { statusCode: 200, headers: corsHeaders, body: "" };
  }

  const tasksRoot = /^\/tasks\/?$/.test(path);
  const taskIdMatch = path.match(/^\/tasks\/([^/]+)$/);

  try {
    if (tasksRoot && method === "GET")  return await listTasks();
    if (tasksRoot && method === "POST") return await createTask(JSON.parse(event.body || "{}"));
    if (taskIdMatch && method === "PUT")    return await updateTask(taskIdMatch[1], JSON.parse(event.body || "{}"));
    if (taskIdMatch && method === "DELETE") return await deleteTask(taskIdMatch[1]);
    return response(404, { error: "Not found" });
  } catch (err) {
    console.error(err);
    return response(500, { error: "Internal server error" });
  }
};

async function listTasks() {
  const result = await client.send(new ScanCommand({ TableName: TABLE_NAME }));
  return response(200, (result.Items || []).map(unmarshal));
}

async function createTask({ title, description }) {
  if (!title) return response(400, { error: "title is required" });
  const now = new Date().toISOString();
  const item = {
    id:          { S: randomUUID() },
    title:       { S: title },
    description: { S: description || "" },
    completed:   { BOOL: false },
    createdAt:   { S: now },
    updatedAt:   { S: now },
  };
  await client.send(new PutItemCommand({ TableName: TABLE_NAME, Item: item }));
  return response(201, unmarshal(item));
}

async function updateTask(id, { title, description, completed }) {
  const exprs = [];
  const names = {};
  const values = {};
  const now = new Date().toISOString();

  if (title !== undefined)       { exprs.push("#t = :t");   names["#t"] = "title";       values[":t"] = { S: title }; }
  if (description !== undefined) { exprs.push("#d = :d");   names["#d"] = "description"; values[":d"] = { S: description }; }
  if (completed !== undefined)   { exprs.push("#c = :c");   names["#c"] = "completed";   values[":c"] = { BOOL: completed }; }

  exprs.push("#u = :u");
  names["#u"] = "updatedAt";
  values[":u"] = { S: now };

  const result = await client.send(new UpdateItemCommand({
    TableName: TABLE_NAME,
    Key: { id: { S: id } },
    UpdateExpression: "SET " + exprs.join(", "),
    ExpressionAttributeNames: names,
    ExpressionAttributeValues: values,
    ReturnValues: "ALL_NEW",
  }));

  return response(200, unmarshal(result.Attributes));
}

async function deleteTask(id) {
  await client.send(new DeleteItemCommand({
    TableName: TABLE_NAME,
    Key: { id: { S: id } },
  }));
  return response(200, { deleted: true });
}

function unmarshal(item) {
  return {
    id:          item.id?.S,
    title:       item.title?.S,
    description: item.description?.S ?? "",
    completed:   item.completed?.BOOL ?? false,
    createdAt:   item.createdAt?.S,
    updatedAt:   item.updatedAt?.S,
  };
}
