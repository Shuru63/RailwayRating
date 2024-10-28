FROM python:3.9.16

ENV PYTHONUNBUFFERED 1
ENV PYTHONDONTWRITEBYTECODE 1
ENV ENV LOCAL

RUN mkdir /app
WORKDIR /app

COPY requirements-linux.txt /app/
RUN pip install -r requirements-linux.txt


# COPY . /app/

EXPOSE 8000

COPY ./entrypoint.sh /app/entrypoint.sh
RUN chmod 777 /app/entrypoint.sh

ENTRYPOINT ["/bin/bash","-c","/app/entrypoint.sh"]