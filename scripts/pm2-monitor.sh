#!/bin/bash
TO_USER="@all"  # 发送给所有人，也可以指定具体的用户
# 获取所有与 PM2 相关的进程信息
pm2_processes=$(ps -ef | grep pm2)

message="PM2 Processes Status:\n"
# echo "PM2 process $pm2_processes is not running as expected. Please check!" 

# 解析进程信息并检查状态
while IFS= read -r line; do
    if [[ $line == *"bin/pm2"* ]]; then
        # 提取进程名称
        process_name=$(echo $line | awk '{print $2}')

        echo "$process_name"
        
        # 获取进程状态
        pm2_status=$(pm2 status $process_name)

        echo "$pm2_status"

        specific_pm2_status=$(echo "$pm2_status" | grep -o "errored")

        echo "$specific_pm2_status"

        # 判断进程状态是否正常
        if [[ -z $specific_pm2_status ]]; then
            # 发送警报，可以使用邮件或其他通知方式
            curl 'https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=af31299c-75f2-4c02-b67f-5796734bb901' \
              -H 'Content-Type: application/json' \
              -d '
              {
                    "msgtype": "text",
                    "text": {
                        "content": "pm2启动异常"
                    }
              }'
        fi
    fi
done <<< "$pm2_processes"

