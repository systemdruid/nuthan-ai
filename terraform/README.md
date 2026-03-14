# Terraform Provisioning Checklist

## Phase 1 — Local prerequisites

- [ ] Install [Terraform](https://developer.hashicorp.com/terraform/install) (>= 1.0)
- [ ] Install [AWS CLI v2](https://docs.aws.amazon.com/cli/latest/userguide/install-cliv2.html)
- [ ] Install [Docker](https://docs.docker.com/get-docker/) (needed to build the backend image on EC2)

---

## Phase 2 — AWS account setup (console)

- [ ] Log in to the AWS console and confirm the account is free-tier eligible
- [ ] Create an EC2 key pair
  - EC2 → Key Pairs → Create key pair
  - Type: RSA, format: `.pem`
  - Download the `.pem` file and move it to `~/.ssh/`
  - Run `chmod 400 ~/.ssh/<keypair>.pem`
  - Note the key pair **name** — you will need it in `terraform.tfvars`
- [ ] Create an IAM user for Terraform (do **not** use the root account)
  - IAM → Users → Create user
  - Attach policy: `AdministratorAccess` (or a scoped policy covering EC2, RDS, S3, VPC)
  - Create access key → type: CLI
  - Save the **Access Key ID** and **Secret Access Key**

---

## Phase 3 — Configure AWS CLI

- [ ] Run `aws configure` and enter:
  - AWS Access Key ID
  - AWS Secret Access Key
  - Default region (must match `aws_region` in `terraform.tfvars`, e.g. `us-east-1`)
  - Default output format: `json`
- [ ] Verify with `aws sts get-caller-identity` — should return your account ID

---

## Phase 4 — Configure Terraform variables

- [ ] `cd terraform/`
- [ ] Copy the example file: `cp terraform.tfvars.example terraform.tfvars`
- [ ] Edit `terraform.tfvars` and fill in every value:
  - `aws_region` — must match your AWS CLI default region
  - `key_pair_name` — name of the key pair created in Phase 2
  - `db_password` — choose a strong password (min 8 chars, no `@` or `/`)
  - `anthropic_api_key` — from [console.anthropic.com](https://console.anthropic.com)
  - Leave `db_name`, `db_username`, `project_name` at defaults or customise

---

## Phase 5 — Provision infrastructure

- [ ] `terraform init` — downloads AWS and random providers
- [ ] `terraform plan` — review what will be created (expect ~15 resources)
- [ ] `terraform apply` — type `yes` when prompted
  - RDS takes 5–10 minutes to become available
- [ ] Note the four output values printed at the end:
  - `backend_ip`
  - `rds_endpoint`
  - `s3_bucket_name`
  - `frontend_url`

---

## Phase 6 — Deploy the backend

- [ ] SSH into the EC2 instance (use the `ssh_command` output):
  ```bash
  ssh -i ~/.ssh/<keypair>.pem ec2-user@<backend_ip>
  ```
- [ ] Wait for the user_data bootstrap to finish (Docker install takes ~2 min):
  ```bash
  tail -f /var/log/cloud-init-output.log
  # Wait until you see "Bootstrap done"
  ```
- [ ] Take ownership of `/app` (root created it during bootstrap):
  ```bash
  sudo chown ec2-user:ec2-user /app
  ```
- [ ] Pull the repository into `/app` (directory already exists with `.env`):
  ```bash
  cd /app
  git init
  git remote set-url origin https://systemdruid:<your-token>@github.com/systemdruid/nuthan-ai.git
  git pull origin main
  ```
- [ ] Confirm `.env` was written by Terraform:
  ```bash
  cat .env   # should show all five variables
  ```
- [ ] Start the backend container:
  ```bash
  docker compose -f docker-compose.prod.yml up -d --build
  ```
- [ ] Verify it is running and migrations applied:
  ```bash
  docker compose -f docker-compose.prod.yml logs -f
  # Should show "Starting development server at http://0.0.0.0:8000"
  ```
- [ ] Smoke-test from your local machine:
  ```bash
  curl http://<backend_ip>:8000/api/notes/
  # Should return []
  ```

---

## Phase 7 — Build and deploy the frontend

- [ ] On your **local machine**, build the React app pointed at the live backend:
  ```bash
  cd frontend
  REACT_APP_API_URL=http://<backend_ip>:8000 npm run build
  ```
- [ ] Upload the build to S3:
  ```bash
  aws s3 sync build/ s3://<s3_bucket_name>/ --delete
  ```
- [ ] Open `frontend_url` in a browser and confirm the app loads

---

## Phase 8 — Smoke test end-to-end

- [ ] Create a note via the UI — confirm it appears in the Notes section
- [ ] Create a task via the UI — confirm it appears in the Tasks section
- [ ] Confirm AI tags are attached after a few seconds
- [ ] Run a natural language query and confirm results appear

---

## Teardown (when done)

- [ ] `terraform destroy` — deletes all provisioned resources
  - RDS and EC2 will stop incurring free-tier hours
- [ ] Empty the S3 bucket first if destroy fails:
  ```bash
  aws s3 rm s3://<s3_bucket_name>/ --recursive
  terraform destroy
  ```

---

## Free-tier watch items

| Resource          | Free tier limit | Risk                                  |
| ----------------- | --------------- | ------------------------------------- |
| EC2 t2.micro      | 750 hrs/month   | Stops being free after 12 months      |
| RDS db.t3.micro   | 750 hrs/month   | Stops being free after 12 months      |
| RDS storage       | 20 GB           | Included                              |
| S3 storage        | 5 GB            | Effectively always free at this scale |
| Data transfer out | 1 GB/month free | Exceeding this incurs small charges   |

> Run `terraform destroy` when not actively using the app to preserve free-tier hours.
