#!/bin/bash

declare -A data_packages=(
    ["1,1"]="25MB for 5 Birr (1 day)"
    ["1,2"]="75MB for 10 Birr (1 day)"
    ["1,3"]="150MB for 20 Birr (1 day)"
    ["1,4"]="500MB for 50 Birr (1 day)"
    ["2,1"]="1GB for 100 Birr (7 days)"
    ["2,2"]="2GB for 150 Birr (7 days)"
    ["3,1"]="4GB for 200 Birr (30 days)"
    ["3,2"]="10GB for 400 Birr (30 days)"
    ["3,3"]="20GB for 700 Birr (30 days)"
    ["3,4"]="50GB for 1200 Birr (30 days)"
)

declare -A sms_packages=(
    ["1,1"]="10 SMS for 2 Birr (1 day)"
    ["1,2"]="20 SMS for 4 Birr (1 day)"
    ["2,1"]="50 SMS for 8 Birr (7 days)"
    ["2,2"]="100 SMS for 15 Birr (7 days)"
    ["3,1"]="200 SMS for 30 Birr (30 days)"
    ["3,2"]="500 SMS for 60 Birr (30 days)"
)

declare -A voice_packages=(
    ["1,1"]="10 minutes for 5 Birr (1 day)"
    ["1,2"]="20 minutes for 8 Birr (1 day)"
    ["2,1"]="60 minutes for 20 Birr (7 days)"
    ["2,2"]="120 minutes for 35 Birr (7 days)"
    ["3,1"]="300 minutes for 80 Birr (30 days)"
    ["3,2"]="600 minutes for 150 Birr (30 days)"
)

show_packages() {
    local -n packages=$1
    local category=$2
    
    echo -e "\n$category Packages:"
    case $category in
        "Data")
            echo "1. Daily Data Packages"
            echo "2. Weekly Data Packages"
            echo "3. Monthly Data Packages"
            ;;
        "SMS")
            echo "1. Daily SMS Packages"
            echo "2. Weekly SMS Packages"
            echo "3. Monthly SMS Packages"
            ;;
        "Voice")
            echo "1. Daily Voice Packages"
            echo "2. Weekly Voice Packages"
            echo "3. Monthly Voice Packages"
            ;;
    esac
    
    read -p "Select a category (1-3) or 0 to go back: " cat_choice
    
    if [ "$cat_choice" -eq 0 ]; then
        return
    fi
    
    echo -e "\nAvailable $category Packages:"
    for key in "${!packages[@]}"; do
        IFS=',' read -r cat pkg <<< "$key"
        if [ "$cat" -eq "$cat_choice" ]; then
            echo "$pkg. ${packages[$key]}"
        fi
    done | sort -t. -k1n
    
    read -p "Select a package (1-4) or 0 to go back: " pkg_choice
    
    if [ "$pkg_choice" -eq 0 ]; then
        show_packages $1 "$category"
        return
    fi
    
    selected_key="$cat_choice,$pkg_choice"
    if [ -z "${packages[$selected_key]}" ]; then
        echo "Invalid selection!"
        show_packages $1 "$category"
        return
    fi
    
    echo -e "\nYou selected: ${packages[$selected_key]}"
    
    while true; do
        echo -e "\nConfirm Purchase:"
        echo "1. Confirm purchase"
        echo "2. Choose another package"
        echo "3. Exit to main menu"
        
        read -p "Enter your choice: " confirm
        
        case $confirm in
            1)
                echo "Successfully purchased ${packages[$selected_key]}"
                echo "Thank you for your purchase!"
                read -p "Press any key to continue..." -n1
                break
                ;;
            2)
                show_packages $1 "$category"
                return
                ;;
            3)
                return
                ;;
            *)
                echo "Invalid choice, please try again"
                ;;
        esac
    done
}

main_menu() {
    while true; do
        clear
        echo -e "\nEthio Telecom Package Selection"
        echo "1. Data Packages"
        echo "2. SMS Packages"
        echo "3. Voice Packages"
        echo "0. Exit"
        
        read -p "Select service type: " choice
        
        case $choice in
            1)
                show_packages data_packages "Data"
                ;;
            2)
                show_packages sms_packages "SMS"
                ;;
            3)
                show_packages voice_packages "Voice"
                ;;
            0)
                echo "Thank you for using Ethio Telecom services!"
                exit 0
                ;;
            *)
                echo "Invalid selection, please try again"
                sleep 1
                ;;
        esac
    done
}

main_menu