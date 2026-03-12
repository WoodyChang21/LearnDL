import boto3
import os
from botocore.config import Config

class SpaceStorageManager:
    def __init__(self):
        self.s3_client = boto3.client(
            "s3",
            region_name=os.getenv("DO_REGION"),
            endpoint_url=os.getenv("DO_ENDPOINT"),
            aws_access_key_id=os.getenv("DO_ACCESS_KEY"),
            aws_secret_access_key=os.getenv("DO_SECRET_KEY"),
            config=Config(signature_version='s3v4')
        )
        self.bucket = os.getenv("DO_BUCKET_NAME")

    def upload_artifact(self, local_path, user_id, session_id, filename):
        key = f"projects/users/{user_id}/sessions/{session_id}/artifacts/{filename}"
        self.s3_client.upload_file(local_path, self.bucket, key)
        return key
    
    def download_artifact(self, local_path, user_id, session_id, filename):
        key = f"projects/users/{user_id}/sessions/{session_id}/artifacts/{filename}"
        self.s3_client.download_file(self.bucket, key, local_path)
        print(f"Artifact downloaded to {local_path}")
        
    def read_artifact(self, user_id, session_id, filename):
        key = f"projects/users/{user_id}/sessions/{session_id}/artifacts/{filename}"
        # get_object returns a dictionary containing the response stream
        response = self.s3_client.get_object(Bucket=self.bucket, Key=key)
        # Read the content as bytes, then decode if it's text
        content = response['Body'].read().decode('utf-8')
        return content

    def upload_metrics(self, metrics_json, user_id, session_id):
        import json
        key = f"projects/users/{user_id}/sessions/{session_id}/outputs/metrics.json"
        self.s3_client.put_object(Body=json.dumps(metrics_json), Bucket=self.bucket, Key=key)
        
    def upload_image(self, local_path, user_id, session_id, filename):
        
        key = f"projects/users/{user_id}/sessions/{session_id}/outputs/{filename}"
        self.s3_client.upload_file(
            local_path, 
            self.bucket, 
            key,
            ExtraArgs={'ContentType': 'image/png'} 
        )
        return key