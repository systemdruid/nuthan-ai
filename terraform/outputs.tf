output "backend_ip" {
  description = "Public IP of the EC2 backend instance"
  value       = aws_eip.backend.public_ip
}

output "rds_endpoint" {
  description = "RDS hostname (used as POSTGRES_HOST)"
  value       = aws_db_instance.postgres.address
}

output "s3_bucket_name" {
  description = "S3 bucket — upload your React build/ here"
  value       = aws_s3_bucket.frontend.id
}

output "frontend_url" {
  description = "S3 static website URL"
  value       = "http://${aws_s3_bucket_website_configuration.frontend.website_endpoint}"
}

output "ssh_command" {
  description = "SSH into the backend instance"
  value       = "ssh -i ~/.ssh/${var.key_pair_name}.pem ec2-user@${aws_eip.backend.public_ip}"
}

output "deploy_command" {
  description = "One-liner to deploy the backend after SSH"
  value       = "cd /app && git init && git remote add origin <your-repo-url> && git pull origin main && docker compose -f docker-compose.prod.yml up -d --build"
}
