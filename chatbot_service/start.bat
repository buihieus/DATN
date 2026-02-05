@echo off
echo Starting PhongTro123 Chatbot Service with Flask...

REM Create and activate virtual environment if it doesn't exist
if not exist venv (
    echo Creating virtual environment...
    python -m venv venv
)

echo Activating virtual environment...
call venv\Scripts\activate.bat

REM Install dependencies
echo Installing dependencies...
pip install --upgrade pip
pip install -r requirements.txt

REM Start the Flask server
echo Starting Flask server...
python main.py

pause