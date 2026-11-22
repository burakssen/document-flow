
locals {
  project     = "document-flow"
  environment = "local"

  name_prefix = "${local.project}-${local.environment}"

  common_tags = {
    Project     = local.project
    Environment = local.environment
    ManagedBy   = "OpenTofu"
  }
}

module "identity" {
  source = "./modules/identity"

  name_prefix = local.name_prefix
  tags        = local.common_tags

  raw_bucket_arn       = module.storage.raw_bucket_arn
  processed_bucket_arn = module.storage.processed_bucket_arn
  user_pool_arn        = module.authentication.user_pool_arn
}

module "storage" {
  source = "./modules/storage"

  name_prefix = local.name_prefix
  tags        = local.common_tags

  kms_key_arn = module.encryption.key_arn
}

module "encryption" {
  source = "./modules/encryption"

  name_prefix = local.name_prefix
  tags        = local.common_tags
}

module "authentication" {
  source = "./modules/authentication"

  name_prefix = local.name_prefix
  tags        = local.common_tags
}
