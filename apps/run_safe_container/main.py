import numpy as np
import pandas as pd
import yfinance as yf
from alpha import alpha_strategy
import json
import os

def buy(capital, current_stock_price):
    """
    Calculate the number of shares to buy with the given capital at the current stock price.

    Parameters:
    capital (float): The amount of money available to invest. Must be non-negative.
    current_stock_price (float): The price of a single share of the stock.

    Returns:
    float: The number of shares that can be purchased with the given capital.

    Notes:
    - Still needs to model the transaction costs
    """

    assert capital >= 0, "Capital is negative! Revisit for bugs or maybe this alpha is gonna make u bankrupt"
    shares_to_buy = capital/current_stock_price
    return shares_to_buy

def closing_prices(stocks):
    """
    Downloads the closing prices for a list of stocks from Yahoo Finance.
    
    Parameters:
        stocks (list): A list of stock tickers.
    
    Returns:
        pandas.DataFrame: A DataFrame with the closing prices for each stock in the list.
    
    Notes:
        The start and end dates are hardcoded as "2020-10-01" and "2024-10-31" respectively.
        The function replaces missing values (NaNs) with 0.
    """
    data = yf.download(stocks, start="2020-10-01", end="2024-10-31")
    data.fillna(0, inplace=True)
    close_prices = data['Close']
    return close_prices


def pnl_calc(alpha_matrix, close_prices):
    """
    Calculate the daily, total daily, and total portfolio PnL (Profit and Loss) based on the given alpha matrix and closing prices.

    Parameters:
    alpha_matrix (np.ndarray): A 2D array where each element represents the alpha value (investment signal) for a stock on a given day.
    close_prices (np.ndarray): A 2D array where each element represents the closing price of a stock on a given day.

    Returns:
    tuple: A tuple containing:
        - daily_pnl (np.ndarray): The profit and loss for each stock on each day.
        - total_daily_pnl (np.ndarray): The total profit and loss for all stocks on each day.
        - total_pnl (float): The total profit and loss for all stocks over the entire period.

    Notes:
    - Needs to be more robust so that it doesn't result in bugs that go undetected. Need an automatic stock closing prices to alpha matrix alignment
    """

    price_changes = close_prices[:, 1:] - close_prices[:, :-1]
    daily_pnl = np.multiply(alpha_matrix[:, :-1], price_changes)  # Element-wise multiplication
    daily_pnl = np.round(daily_pnl, 2)
    total_daily_pnl = daily_pnl.sum(axis=0)
    total_pnl = total_daily_pnl.sum()
    
    return daily_pnl, total_daily_pnl, total_pnl


def count_transactions(alpha_matrix):
    """
    Counts the number of transactions (buys and sells) for each stock in a given alpha matrix, to approximate transaction fees.

    Parameters:
    alpha_matrix (np.matrix): A matrix containing alpha values for each stock on each day (rows for stocks, columns for days).

    Returns:
    np.array: An array containing the number of transactions for each stock.
    """

    padded_matrix = np.hstack([np.zeros((alpha_matrix.shape[0], 1)), alpha_matrix])
    differences = np.diff(padded_matrix, axis=1)
    
    # Count non-zero changes for each column (stock)
    position_changes = np.sum(differences != 0, axis=1)
    
    return position_changes

def hold_indefinitely(close_prices, capital):
    """
    Generate an alpha matrix for a baseline strategy where the initial capital is completely invested in the stock from the first available day of data and never sold.

    Parameters:
    close_prices (pandas.DataFrame): A matrix containing the closing prices for each stock on each day (rows for stocks, columns for days).
    capital (float): The initial capital to be invested.

    Returns:
    np.matrix: A matrix representing the number of shares of each stock that should be bought or sold on each day (rows for stocks, columns for days).
    """
    all_stocks = list(close_prices.columns)
    alpha_matrix = []
    for col in all_stocks:
        day_over_day = list(close_prices[col])
        stocks_per_day = []
        for i in range(len(day_over_day)):
            # Usually this means stock price hasn't existed yet
            if day_over_day[i] == 0:
                stocks_per_day.append(0)
                continue

            if stocks_per_day == [] or stocks_per_day[-1] == 0:
                stocks_per_day.append(buy(capital, day_over_day[i]))
            else:
                stocks_per_day.append(stocks_per_day[-1])
        
        alpha_matrix.append(stocks_per_day)

    return np.matrix(alpha_matrix)

def test_versus_baseline(stocks, alpha_strategy):
    """
    Test a given alpha strategy against a baseline strategy of holding forever.

    Parameters:
    stocks (list): List of stock tickers to test.
    alpha_strategy (function): Alpha strategy to test.

    Returns:
    tuple: (total_pnl, total_pnl_baseline, percentage_improvement)

    Notes:
    - Baseline strategy should have multiple options, such as one to compare holding SPY forever. Should also model difference in variance, and other metrics that may matter beyond just pnl
    """
    capital = 10000
    close_prices = closing_prices(stocks)

    alpha_matrix = alpha_strategy(close_prices, capital)
    close_prices_matrix = np.matrix(close_prices).T
    daily_pnl, total_daily_pnl, total_pnl = pnl_calc(alpha_matrix, close_prices_matrix)
    transaction_costs = count_transactions(alpha_matrix)
    

    alpha_matrix_baseline = hold_indefinitely(close_prices, capital)
    close_prices_matrix_baseline = np.matrix(close_prices).T
    daily_pnl_baseline, total_daily_pnl_baseline, total_pnl_baseline = pnl_calc(alpha_matrix_baseline, close_prices_matrix_baseline)
    transaction_costs_baseline = count_transactions(alpha_matrix_baseline)

    return total_pnl, total_pnl_baseline, float(round((total_pnl / total_pnl_baseline) * 100, 2)), transaction_costs, transaction_costs_baseline                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                

def format_results(results):
    """
    Formats the results of the test_versus_baseline function

    Parameters:
    results (tuple): Immediate returned results from test_versus_baseline function
    """

    total_pnl, total_pnl_baseline, percentage_improvement, transaction_costs, transaction_costs_baseline = results
    # print("\n\nWhen using an initial capital of 10000...\n")
    # print("RESULTS FROM THIS ALPHA:")
    # print(f"Total PnL: {round(total_pnl, 2)}\n")
    # print("COMPARED TO BASELINE OF HOLDING FOREVER:")
    # print(f"Total PnL: {round(total_pnl_baseline, 2)}\n")
    # print(f"PnL as a Percentage of the Baseline: {percentage_improvement}%")

    # print(f"\n\nNumber of transactions for this alpha are: {np.sum(transaction_costs)}")
    # print(f"Number of transactions for the baseline are: {np.sum(transaction_costs_baseline)}")

    results_dict = {
        "total_pnl": round(total_pnl, 2),
        "total_pnl_baseline": round(total_pnl_baseline, 2),
        "percentage_improvement": percentage_improvement,
        "transaction_costs": int(np.sum(transaction_costs)),
        "transaction_costs_baseline": int(np.sum(transaction_costs_baseline))
    }
    result_path = os.environ.get("RESULT_PATH", "/output/result.json")

    # Make the file:
    os.makedirs(os.path.dirname(result_path), exist_ok=True)

    with open(result_path, "w") as f:
        json.dump(results_dict, f, indent=4)

result = test_versus_baseline(["TSLA"], alpha_strategy)
format_results(result)
