import datetime
import os
import dotenv

# Load environment variables from .env file
dotenv_file = dotenv.find_dotenv()
dotenv.load_dotenv(dotenv_file)

# A global list of the leagues to be autobalanced.
autobalance_listings = [
    "DBDL"
]

autobalancer_targets = {}

# Go through listings and create a target object for each one.
for listing in autobalance_listings:
    autobalancer_targets[listing] = {
        "name": listing,
        "url": os.getenv(f"AUTOBALANCE-{listing}-URL"),
        "frequency": os.getenv(f"AUTOBALANCE-{listing}-FREQUENCY"),
        "last_run": os.getenv(f"AUTOBALANCE-{listing}-LAST-RUN"),
    }

def update_autobalance(target):
    # Get URL
    url = autobalancer_targets[target]['url']

    # Fetch data from URL
    

print(autobalancer_targets)

for target in autobalancer_targets:
    print(f"Target: {target}")
    print(f"Last run: {autobalancer_targets[target]['last_run']}")
    print(f"Frequency: {autobalancer_targets[target]['frequency']}")
    
    # Get current epoch
    current_epoch = round(datetime.datetime.now().timestamp())

    # Get last run epoch
    last_run_epoch = int(autobalancer_targets[target]['last_run'])

    # Get frequency
    frequency = int(autobalancer_targets[target]['frequency'])

    # Get difference between current epoch and last run epoch
    difference = current_epoch - last_run_epoch

    # If the difference is greater than the frequency, run the autobalancer.
    if difference >= frequency:
        print(f"Running autobalancer for {target}...")
        # Run autobalancer
        # Update last run epoch
        autobalancer_targets[target]['last_run'] = current_epoch
        # Update .env file
        os.environ[f"AUTOBALANCE-{target}-LAST-RUN"] = str(current_epoch)
        dotenv.set_key(dotenv_file, f'AUTOBALANCE-{target}-LAST-RUN', os.environ[f"AUTOBALANCE-{target}-LAST-RUN"])
    else:
        print(f"Skipping autobalancer for {target}... (difference: {difference})")
