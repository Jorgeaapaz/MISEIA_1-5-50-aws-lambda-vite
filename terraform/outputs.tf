output "lambda_url" {
  description = "Public URL of the API Gateway endpoint"
  value       = aws_apigatewayv2_stage.default_stage.invoke_url
}
