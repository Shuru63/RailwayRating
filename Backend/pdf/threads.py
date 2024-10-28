import logging
import os
import threading

from cms.settings import SERVICE_ACCOUNT_KEY, FOLDER_ID, EMAIL_SENDER
from .utils import upload_file_to_drive, send_pdf


class MailPDF(threading.Thread):
    def __init__(self, file_names, file_paths, compressed_file_paths, subject, message, request, run_thread_event):
        self.request = request
        self.file_names = file_names if isinstance(file_names, list) else [file_names]
        self.file_paths = file_paths if isinstance(file_paths, list) else [file_paths]
        self.compressed_file_paths = compressed_file_paths if isinstance(compressed_file_paths, list) else [compressed_file_paths]
        self.subject = subject
        self.message = message
        self.run_thread_event = run_thread_event
        threading.Thread.__init__(self)

    def run(self):
        try:
            message = self.message
            for file_name, file_path, compressed_file_path in zip(self.file_names, self.file_paths, self.compressed_file_paths):
                public_url = upload_file_to_drive(file_name, compressed_file_path, SERVICE_ACCOUNT_KEY, FOLDER_ID)
                if public_url:
                    message += f'\n{file_name}: \t{public_url}'
                    os.remove(file_path)
                    os.remove(compressed_file_path)
                else:
                    logging.exception(f"An error occurred while uploading file to drive: {file_name}")
            send_pdf(self.subject, message, EMAIL_SENDER, [self.request.user.email])
            logging.info("Thread completed")

        except Exception as e:
            logging.exception(f"An error occurred in MailPDF: {repr(e)}")

        finally:
            logging.info("Thread cleared: MailPDF")
            self.run_thread_event.clear()
