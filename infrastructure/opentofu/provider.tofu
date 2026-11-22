variable "aws_endpoint" {
  type    = string
  default = "http://localhost:4566"
}

variable "aws_region" {
  type    = string
  default = "eu-central-1"
}

provider "aws" {
  region     = var.aws_region
  access_key = "test"
  secret_key = "test"

  skip_credentials_validation = true
  skip_metadata_api_check     = true
  skip_requesting_account_id  = true

  s3_use_path_style = true

  endpoints {
    iam        = var.aws_endpoint
    sts        = var.aws_endpoint
    s3         = var.aws_endpoint
    cognitoidp = var.aws_endpoint
    kms        = var.aws_endpoint
  }
}
