output "backend_ip" {
  description = "Public IP of the EC2 backend instance"
  value       = aws_eip.backend.public_ip
}


output "s3_bucket_name" {
  description = "S3 bucket — upload your React build/ here"
  value       = aws_s3_bucket.frontend.id
}

output "frontend_url" {
  description = "S3 static website URL (HTTP only — use cloudfront_url for HTTPS)"
  value       = "http://${aws_s3_bucket_website_configuration.frontend.website_endpoint}"
}

output "cloudfront_url" {
  description = "CloudFront HTTPS URL for the frontend"
  value       = "https://${aws_cloudfront_distribution.frontend.domain_name}"
}

output "ssh_command" {
  description = "SSH into the backend instance"
  value       = "ssh -i ~/.ssh/${var.key_pair_name}.pem ec2-user@${aws_eip.backend.public_ip}"
}

output "deploy_command" {
  description = "One-liner to deploy the backend after SSH"
  value       = "cd /app && git init && git remote add origin <your-repo-url> && git pull origin main && docker compose -f docker-compose.prod.yml up -d --build"
}
