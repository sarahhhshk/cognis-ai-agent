from mcp.server.fastmcp import FastMCP

mcp = FastMCP("Cognis MCP")


@mcp.tool()
def generate_notes(topic: str):
    """Generate study notes."""
    return f"Generating notes for {topic}"


@mcp.tool()
def generate_quiz(topic: str):
    """Generate quiz."""
    return f"Generating quiz for {topic}"


@mcp.tool()
def generate_planner(topic: str, exam_date: str):
    """Generate study planner."""
    return f"Planner for {topic}, exam on {exam_date}"


if __name__ == "__main__":
    mcp.run()