# 使用阿里云的 Python 镜像作为基础镜像
FROM registry.cn-beijing.aliyuncs.com/ciye/python:3.12-slim


# 设置工作目录
WORKDIR /app

# 复制项目依赖配置文件
COPY requirements.txt ./

# 安装构建工具（包括 gcc 和必要的依赖），然后删除它们
RUN apt-get update \
    && apt-get install -y gcc build-essential libssl-dev \
    && pip install --upgrade pip \
    && pip install -r requirements.txt \
    && pip install uwsgi \
    && apt-get remove -y gcc build-essential libssl-dev \
    && apt-get autoremove -y \
    && apt-get clean


# 复制项目代码到容器中
COPY . .

# 设置环境变量，确保 Python 输出无缓存
ENV PYTHONUNBUFFERED=1

# 暴露端口
EXPOSE 8000

# 使用 uWSGI 启动应用
CMD ["uwsgi", "--http", "0.0.0.0:8000", "--module", "core.wsgi:application", "--master", "--processes", "4", "--threads", "2"]
