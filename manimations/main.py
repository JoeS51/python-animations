from manim import *


class CreateCircle(Scene):
    def construct(self):
        circle = Circle()  # create a circle
        circle.set_fill(PINK, opacity=0.5)  # set the color and transparency
        self.play(Create(circle))  # show the circle on screen


class ReactVirtualDOMDiff(Scene):
    """
    Visualizes how React's Virtual DOM diffing algorithm works.
    Shows the old VDOM tree, new VDOM tree, and highlights the differences.
    """

    def construct(self):
        # Title
        title = Text("React Virtual DOM Diffing", font_size=40, color=BLUE)
        title.to_edge(UP)
        self.play(Write(title))
        self.wait(0.5)

        # Create the "Old Virtual DOM" label
        old_label = Text("Old Virtual DOM", font_size=24, color=GRAY)
        old_label.move_to(LEFT * 4 + UP * 2)

        # Create the "New Virtual DOM" label
        new_label = Text("New Virtual DOM", font_size=24, color=GRAY)
        new_label.move_to(RIGHT * 4 + UP * 2)

        self.play(FadeIn(old_label), FadeIn(new_label))

        # ===== OLD VIRTUAL DOM TREE =====
        old_tree = self.create_dom_tree(
            LEFT * 4,
            nodes={
                "root": {"text": "<div>", "color": BLUE},
                "child1": {"text": "<h1>", "color": GREEN},
                "child2": {"text": "<p>", "color": GREEN},
                "child3": {"text": "<button>", "color": GREEN},
            },
            values={
                "child1": "Hello",
                "child2": "World",
                "child3": "Click",
            },
        )

        # ===== NEW VIRTUAL DOM TREE =====
        new_tree = self.create_dom_tree(
            RIGHT * 4,
            nodes={
                "root": {"text": "<div>", "color": BLUE},
                "child1": {"text": "<h1>", "color": GREEN},
                "child2": {"text": "<p>", "color": YELLOW},  # Changed
                "child3": {"text": "<button>", "color": GREEN},
            },
            values={
                "child1": "Hello",
                "child2": "React!",  # Changed value
                "child3": "Click",
            },
        )

        # Animate old tree appearing
        self.play(*[Create(item) for item in old_tree["shapes"]])
        self.play(*[Write(item) for item in old_tree["texts"]])
        self.wait(0.5)

        # Animate new tree appearing
        self.play(*[Create(item) for item in new_tree["shapes"]])
        self.play(*[Write(item) for item in new_tree["texts"]])
        self.wait(0.5)

        # ===== DIFFING PHASE =====
        diff_title = Text("Diffing...", font_size=28, color=ORANGE)
        diff_title.move_to(DOWN * 0.5)
        self.play(Write(diff_title))

        # Highlight comparison - scanning through nodes
        for i, (old_node, new_node) in enumerate(
            zip(old_tree["node_boxes"], new_tree["node_boxes"])
        ):
            scan_highlight_old = SurroundingRectangle(old_node, color=YELLOW, buff=0.1)
            scan_highlight_new = SurroundingRectangle(new_node, color=YELLOW, buff=0.1)
            self.play(
                Create(scan_highlight_old), Create(scan_highlight_new), run_time=0.3
            )
            self.wait(0.2)
            self.play(
                FadeOut(scan_highlight_old), FadeOut(scan_highlight_new), run_time=0.2
            )

        # Highlight the difference found (child2 - the <p> element)
        diff_found = Text("Difference Found!", font_size=24, color=RED)
        diff_found.move_to(DOWN * 0.5)
        self.play(Transform(diff_title, diff_found))

        # Highlight the changed node
        old_changed = SurroundingRectangle(
            old_tree["node_boxes"][2], color=RED, buff=0.1
        )
        new_changed = SurroundingRectangle(
            new_tree["node_boxes"][2], color=GREEN, buff=0.1
        )
        self.play(Create(old_changed), Create(new_changed))
        self.wait(0.5)

        # Show the value change
        change_arrow = Arrow(
            old_tree["value_texts"][1].get_right() + RIGHT * 0.2,
            new_tree["value_texts"][1].get_left() + LEFT * 0.2,
            color=ORANGE,
            buff=0.1,
        )
        change_label = Text('"World" -> "React!"', font_size=20, color=ORANGE)
        change_label.next_to(change_arrow, DOWN, buff=0.1)
        self.play(GrowArrow(change_arrow), Write(change_label))
        self.wait(1)

        # ===== RECONCILIATION PHASE =====
        self.play(
            FadeOut(diff_title),
            FadeOut(change_arrow),
            FadeOut(change_label),
            FadeOut(old_changed),
            FadeOut(new_changed),
        )

        reconcile_title = Text(
            "Reconciliation: Update Real DOM", font_size=28, color=GREEN
        )
        reconcile_title.move_to(DOWN * 0.5)
        self.play(Write(reconcile_title))

        # Create Real DOM representation
        real_dom_label = Text("Real DOM", font_size=24, color=WHITE)
        real_dom_label.move_to(DOWN * 1.5)
        self.play(Write(real_dom_label))

        # Show minimal update
        real_dom_box = RoundedRectangle(
            height=1.2, width=3, corner_radius=0.1, color=WHITE
        )
        real_dom_box.move_to(DOWN * 2.5)
        real_dom_text = Text("<p>React!</p>", font_size=20, color=GREEN)
        real_dom_text.move_to(real_dom_box.get_center())

        update_text = Text("Only update what changed!", font_size=20, color=YELLOW)
        update_text.move_to(DOWN * 3.5)

        self.play(Create(real_dom_box), Write(real_dom_text))
        self.play(Write(update_text))

        # Flash to show efficient update
        self.play(real_dom_box.animate.set_fill(GREEN, opacity=0.3), run_time=0.5)
        self.play(real_dom_box.animate.set_fill(GREEN, opacity=0), run_time=0.5)
        self.wait(1)

        # Final message
        self.play(
            FadeOut(reconcile_title),
            FadeOut(real_dom_label),
            FadeOut(real_dom_box),
            FadeOut(real_dom_text),
            FadeOut(update_text),
        )

        final_message = Text(
            "React only updates changed elements\nfor optimal performance!",
            font_size=28,
            color=BLUE,
        )
        final_message.move_to(DOWN * 1)
        self.play(Write(final_message))
        self.wait(2)

    def create_dom_tree(self, position, nodes, values):
        """Create a visual DOM tree structure"""
        shapes = []
        texts = []
        node_boxes = []
        value_texts = []

        # Root node
        root_box = RoundedRectangle(
            height=0.6, width=1.2, corner_radius=0.1, color=nodes["root"]["color"]
        )
        root_box.move_to(position + UP * 1)
        root_text = Text(nodes["root"]["text"], font_size=18)
        root_text.move_to(root_box.get_center())
        shapes.append(root_box)
        texts.append(root_text)
        node_boxes.append(root_box)

        # Child nodes
        children = ["child1", "child2", "child3"]
        child_positions = [UP * 0, DOWN * 1, DOWN * 2]

        for i, (child, pos) in enumerate(zip(children, child_positions)):
            # Node box
            box = RoundedRectangle(
                height=0.6, width=1.2, corner_radius=0.1, color=nodes[child]["color"]
            )
            box.move_to(position + pos + LEFT * 0.8)
            node_text = Text(nodes[child]["text"], font_size=18)
            node_text.move_to(box.get_center())

            # Value box
            value_box = RoundedRectangle(
                height=0.5, width=1.0, corner_radius=0.05, color=GRAY
            )
            value_box.move_to(position + pos + RIGHT * 0.8)
            value_text = Text(values[child], font_size=14, color=WHITE)
            value_text.move_to(value_box.get_center())

            # Connection line from parent
            if i == 0:
                line = Line(root_box.get_bottom(), box.get_top(), color=GRAY)
            else:
                prev_box = node_boxes[-1]
                line = Line(prev_box.get_bottom(), box.get_top(), color=GRAY)

            # Connection to value
            value_line = Line(box.get_right(), value_box.get_left(), color=GRAY)

            shapes.extend([line, box, value_line, value_box])
            texts.extend([node_text, value_text])
            node_boxes.append(box)
            value_texts.append(value_text)

        return {
            "shapes": shapes,
            "texts": texts,
            "node_boxes": node_boxes,
            "value_texts": value_texts,
        }
