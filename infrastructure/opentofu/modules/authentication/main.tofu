variable "name_prefix" {
  type = string
}

variable "tags" {
  type = map(string)
}

resource "aws_cognito_user_pool" "main" {
  name = "${var.name_prefix}-users"

  username_attributes = ["email"]

  auto_verified_attributes = ["email"]

  password_policy {
    minimum_length                   = 12
    require_lowercase                = true
    require_uppercase                = true
    require_numbers                  = true
    require_symbols                  = true
    temporary_password_validity_days = 7
  }

  tags = var.tags
}

resource "aws_cognito_user_pool_client" "frontend" {
  name         = "${var.name_prefix}-frontend"
  user_pool_id = aws_cognito_user_pool.main.id

  generate_secret = false

  explicit_auth_flows = [
    "ALLOW_USER_SRP_AUTH",
    "ALLOW_USER_PASSWORD_AUTH",
    "ALLOW_REFRESH_TOKEN_AUTH"
  ]

  prevent_user_existence_errors = "ENABLED"
}
