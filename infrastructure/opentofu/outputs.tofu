output "raw_bucket_name" {
  value       = module.storage.raw_bucket_name
  description = "Name of the raw documents S3 bucket"
}

output "processed_bucket_name" {
  value       = module.storage.processed_bucket_name
  description = "Name of the processed documents S3 bucket"
}

output "raw_bucket_arn" {
  value       = module.storage.raw_bucket_arn
  description = "ARN of the raw documents S3 bucket"
}

output "processed_bucket_arn" {
  value       = module.storage.processed_bucket_arn
  description = "ARN of the processed documents S3 bucket"
}

output "user_pool_id" {
  value       = module.authentication.user_pool_id
  description = "Cognito user pool ID"
}

output "client_id" {
  value       = module.authentication.client_id
  description = "Cognito user pool client ID"
}

output "user_pool_arn" {
  value       = module.authentication.user_pool_arn
  description = "Cognito user pool ARN"
}

output "key_arn" {
  value       = module.encryption.key_arn
  description = "KMS key ARN used for document encryption"
}

output "key_id" {
  value       = module.encryption.key_id
  description = "KMS key ID used for document encryption"
}

output "api_access_key_id" {
  value       = module.identity.access_key_id
  description = "AWS access key ID for the document-flow API IAM user"
}

output "api_access_key_secret" {
  value       = module.identity.access_key_secret
  description = "AWS secret access key for the document-flow API IAM user"
  sensitive   = true
}

output "api_user_name" {
  value       = module.identity.user_name
  description = "IAM user name for the document-flow API"
}
