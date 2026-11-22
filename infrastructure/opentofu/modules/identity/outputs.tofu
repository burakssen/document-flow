output "access_key_id" {
  value       = aws_iam_access_key.api_local.id
  description = "AWS access key ID for the document-flow API local IAM user"
}

output "access_key_secret" {
  value       = aws_iam_access_key.api_local.secret
  description = "AWS secret access key for the document-flow API local IAM user"
  sensitive   = true
}

output "user_name" {
  value = aws_iam_user.api_local.name
}
