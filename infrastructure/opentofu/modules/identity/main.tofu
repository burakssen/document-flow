variable "name_prefix" {
  type = string
}

variable "tags" {
  type = map(string)
}

variable "raw_bucket_arn" {
  type        = string
  description = "ARN of the raw documents S3 bucket"
}

variable "processed_bucket_arn" {
  type        = string
  description = "ARN of the processed documents S3 bucket"
}

variable "user_pool_arn" {
  type        = string
  description = "ARN of the Cognito user pool"
}

resource "aws_iam_user" "api_local" {
  name = "${var.name_prefix}-api-local"
  tags = var.tags
}

resource "aws_iam_policy" "api_s3" {
  name = "${var.name_prefix}-api-s3-policy"

  policy = jsonencode({
    Version = "2012-10-17"

    Statement = [
      {
        Sid    = "ListDocumentBuckets"
        Effect = "Allow"

        Action = [
          "s3:ListBucket"
        ]

        Resource = [
          var.raw_bucket_arn,
          var.processed_bucket_arn
        ]
      },
      {
        Sid    = "ManageDocuments"
        Effect = "Allow"

        Action = [
          "s3:GetObject",
          "s3:PutObject",
          "s3:DeleteObject",
          "s3:GetObjectVersion"
        ]

        Resource = [
          "${var.raw_bucket_arn}/*",
          "${var.processed_bucket_arn}/*"
        ]
      },
      {
        Sid    = "ConfirmCognitoUsers"
        Effect = "Allow"

        Action = [
          "cognito-idp:AdminConfirmSignUp"
        ]

        Resource = [
          var.user_pool_arn
        ]
      }
    ]
  })

  tags = var.tags
}

resource "aws_iam_user_policy_attachment" "api_s3" {
  user       = aws_iam_user.api_local.name
  policy_arn = aws_iam_policy.api_s3.arn
}

resource "aws_iam_access_key" "api_local" {
  user = aws_iam_user.api_local.name
}
