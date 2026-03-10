import transformers
from transformers import BertModel, BertTokenizer
from transformers import DistilBertModel, DistilBertTokenizer
from transformers import LongformerModel, LongformerTokenizer

import torch

DEVICE = "cuda" if torch.cuda.is_available() else "cpu"



class BERT:
    def __init__(self, model_name="bert-base-cased", freeze_base_model=True):
        self._model_name = model_name
        self.tokenizer = BertTokenizer.from_pretrained(model_name)
        self.bert_model = BertModel.from_pretrained(model_name)
        self.bert_model.to(DEVICE)
        self.bert_model.eval()
        if freeze_base_model:
            for param in self.bert_model.parameters():
                param.requires_grad = False

    def tokenize(self, sentence, max_length=400):
        encoding = self.tokenizer(
            sentence,
            max_length=max_length,
            add_special_tokens=True,
            return_token_type_ids=False,
            return_attention_mask=True,
            truncation=True,
        )
        return encoding

    def embed(self, input_ids, attention_mask):

        output = self.bert_model(
            input_ids=input_ids,
            attention_mask=attention_mask,
            output_hidden_states=True,
        )

        return output

class DISTILBERT:
    def __init__(self, model_name="distilbert-base-uncased", freeze_base_model=True):
        self._model_name = model_name
        self.tokenizer = DistilBertTokenizer.from_pretrained(model_name)
        self.bert_model = DistilBertModel.from_pretrained(model_name)
        self.bert_model.to(DEVICE)
        self.bert_model.eval()
        if freeze_base_model:
            for param in self.bert_model.parameters():
                param.requires_grad = False

    def tokenize(self, sentence, max_length=400):
        encoding = self.tokenizer(
            sentence,
            max_length=max_length,
            add_special_tokens=True,
            return_token_type_ids=False,
            return_attention_mask=True,
            truncation=True,
        )
        return encoding

    def embed(self, input_ids, attention_mask):

        output = self.bert_model(
            input_ids=input_ids,
            attention_mask=attention_mask,
            output_hidden_states=True,
        )

        return output

class LONGFORMER:
    def __init__(self, model_name="allenai/longformer-base-4096", freeze_base_model=True):
        self._model_name = model_name
        self.tokenizer = LongformerTokenizer.from_pretrained(model_name)
        self.bert_model = LongformerModel.from_pretrained(model_name)
        self.bert_model.to(DEVICE)
        self.bert_model.eval()
        if freeze_base_model:
            for param in self.bert_model.parameters():
                param.requires_grad = False

    def tokenize(self, sentence, max_length=None):
        # max_length = self.bert_model.config.max_position_embeddings if max_length is None else max_length
        encoding = self.tokenizer(
            sentence,
            max_length=4096,
            add_special_tokens=True,
            return_token_type_ids=False,
            return_attention_mask=True,
            truncation=True,
        )
        return encoding

    def embed(self, input_ids, attention_mask):

        output = self.bert_model(
            input_ids=input_ids,
            attention_mask=attention_mask,
            output_hidden_states=True,
        )

        return output

# This is for type hinting
EMBED_MODEL_TYPES = BERT | DISTILBERT | LONGFORMER

# This is for the model names
MODEL_NAMES = {
    "bert_model": BERT,
    "distilbert_model": DISTILBERT,
    "longformer_model": LONGFORMER
}

MODEL_INSTANCES = {
    "bert_model": "bert-base-uncased",
    "distilbert_model": "distilbert-base-uncased",
    "longformer_model": "allenai/longformer-base-4096"
}


if __name__ == "__main__":
    sample_txt = (
        "I want to learn how to do sentiment analysis using BERT and tokenizer."
    )
    # encoding = MODEL_NAMES["bert_model"].tokenize(sample_txt)
    # output = MODEL_NAMES["bert_model"].embed(encoding["input_ids"].to(DEVICE), encoding["attention_mask"].to(DEVICE))
    # print(output.keys())
    # encoding = MODEL_NAMES["distilbert_model"].tokenize(sample_txt)
    # output = MODEL_NAMES["distilbert_model"].embed(encoding["input_ids"].to(DEVICE), encoding["attention_mask"].to(DEVICE))
    # print(output.keys())
    # print(output.hidden_states[-1].shape[-1])
    # print(bert_model.bert_model.config.hidden_size)
    # print(distilbert_model.bert_model.config.max_position_embeddings)
    # print(distilbert_model.tokenizer.model_max_length)
    print(longformer_model.bert_model.config.max_position_embeddings)