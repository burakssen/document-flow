output "key_arn" {
  value = aws_kms_key.documents.arn
}

output "key_id" {
  value = aws_kms_key.documents.key_id
}
