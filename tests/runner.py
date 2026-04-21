import unittest
import json
import os
import sys
import time

# To allow importing from parent backend folder
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from unit_test import TestMovie Recommendation SystemCore
from integration_test import TestMovie Recommendation SystemIntegration

def run_tests_and_report():
    print("Running Movie Recommendation System Test Suite...")
    
    loader = unittest.TestLoader()
    suite = unittest.TestSuite()
    
    # Add Test Cases
    suite.addTests(loader.loadTestsFromTestCase(TestMovie Recommendation SystemCore))
    suite.addTests(loader.loadTestsFromTestCase(TestMovie Recommendation SystemIntegration))
    
    # Custom Result to capture details
    class TestResultJSON(unittest.TextTestResult):
        def __init__(self, *args, **kwargs):
            super().__init__(*args, **kwargs)
            self.results_data = []

        def addSuccess(self, test):
            super().addSuccess(test)
            self.results_data.append({"name": test._testMethodName, "doc": test._testMethodDoc, "status": "pass", "time": time.time()})

        def addFailure(self, test, err):
            super().addFailure(test, err)
            self.results_data.append({"name": test._testMethodName, "doc": test._testMethodDoc, "status": "fail", "error": str(err), "time": time.time()})

        def addError(self, test, err):
            super().addError(test, err)
            self.results_data.append({"name": test._testMethodName, "doc": test._testMethodDoc, "status": "error", "error": str(err), "time": time.time()})

    runner = unittest.TextTestRunner(resultclass=TestResultJSON)
    start_time = time.time()
    result = runner.run(suite)
    end_time = time.time()

    summary = {
        "timestamp": time.strftime("%Y-%m-%d %H:%M:%S"),
        "duration": round(end_time - start_time, 3),
        "total": result.testsRun,
        "passed": result.testsRun - len(result.failures) - len(result.errors),
        "failed": len(result.failures),
        "errors": len(result.errors),
        "tests": result.results_data
    }

    # Write JSON report
    report_path = os.path.join(os.path.dirname(__file__), 'test_results.json')
    with open(report_path, 'w') as f:
        json.dump(summary, f, indent=4)
        
    print(f"Report generated at {report_path}")
    print(f"Summary: {summary['passed']}/{summary['total']} tests passed.")

if __name__ == "__main__":
    run_tests_and_report()
