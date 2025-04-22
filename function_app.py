import logging
import azure.functions as func
import os

app = func.FunctionApp()

@app.timer_trigger(schedule="1 * * * * *", arg_name="myTimer", run_on_startup=False,
              use_monitor=False) 
def timer_trigger(myTimer: func.TimerRequest) -> None:
    if myTimer.past_due:
        logging.info('The timer is past due!')
    #os.system("C:\Users\GuTianlai\.conda\envs\335\python ./MachineLearning/webSearch.py")
    os.system("python ./MachineLearning/webSearch.py")
    logging.info('Python timer trigger function executed.')