from data_preprocess_pipeline.dataloader import datapreprocess_dataloader
import time


data_loader_class = datapreprocess_dataloader(data_path=None)
train_loader, val_loader, test_loader = data_loader_class.split_data()

if __name__ == "__main__":
    start_time = time.time()
    print(len(train_loader), len(val_loader), len(test_loader))
    end_time = time.time()
    print(f"Time taken: {end_time - start_time} seconds")