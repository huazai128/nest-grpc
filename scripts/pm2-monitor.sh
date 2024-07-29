#!/bin/bash

# 获取所有与 PM2 相关的进程信息
pm2_processes=$(ps -ef | grep pm2)

message="PM2 Processes Status:\n"

echo 

# 解析进程信息并检查状态
while IFS= read -r line; do
    if [[ $line == *"[P]M2"* ]]; then
        # 提取进程名称
        process_name=$(echo $line | awk '{print $8}')
        
        # 获取进程状态
        pm2_status=$(pm2 status $process_name)
        
        # 判断进程状态是否正常
        if [[ $pm2_status != *"online"* ]]; then
            # 发送警报，可以使用邮件或其他通知方式
            echo "PM2 process $process_name is not running as expected. Please check!" | mail -s "PM2 Process Alert" your_email@example.com
        fi
    fi
done <<< "$pm2_processes"