@echo off
chcp 65001 >nul
title 识渔计划 本地服务
cd /d "%~dp0webapp"

rem 依次尝试可用的 Python 解释器启动静态服务（端口 8765）
set PY=
where python >nul 2>nul && python -c "import sys" >nul 2>nul && set PY=python
if not defined PY (
  where py >nul 2>nul && set PY=py
)
if not defined PY (
  if exist "C:\Users\lenovo\miniconda3\python.exe" set PY=C:\Users\lenovo\miniconda3\python.exe
)
if not defined PY (
  echo 未找到 Python，可用任意静态服务器指向 webapp 目录（如：npx serve）
  pause & exit /b 1
)

start "" "http://127.0.0.1:8765"
echo 正在启动识渔计划（关闭本窗口即停止服务）...
%PY% -m http.server 8765
