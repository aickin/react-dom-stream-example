#!/bin/bash
        for i in `seq 1 100`;
        do
		curl -s -w "%{time_pretransfer} %{time_starttransfer} %{time_total}\n" -o /dev/null $1
        done    
