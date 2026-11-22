variable "name_prefix" {
  type = string
}

variable "tags" {
  type = map(string)
}

resource "aws_kms_key" "documents" {
  description             = "${var.name_prefix} document encryption"
  deletion_window_in_days = 7
  enable_key_rotation     = true

  tags = var.tags
}

resource "aws_kms_alias" "documents" {
  name          = "alias/${var.name_prefix}-documents"
  target_key_id = aws_kms_key.documents.key_id
}
