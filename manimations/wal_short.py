"""A 20-second, narration-paced introduction to write-ahead logging.

Voiceover:
Your database says commit. Then the power dies before the data reaches disk.
So why isn't the transaction lost? Before acknowledging the commit, the database
writes the change to a durable write-ahead log. After a crash, it replays that
log and restores the data. Record first. Apply later.
"""

from manim import *


config.pixel_width = 1080
config.pixel_height = 1920
config.frame_width = 9
config.frame_height = 16
config.frame_rate = 30
config.background_color = "#050505"


INK = "#F5F5F0"
ACID = INK
RED = INK
GRAY = "#92928D"
DARK_GRAY = "#292927"
FONT = "Source Code Pro"


class WALShort(Scene):
    def construct(self):
        self.add(self.editorial_frame())

        # 0.0-3.2s | "Your database says commit."
        section = self.section_label("01 / THE PROMISE")
        commit = self.headline("COMMIT", 104).move_to(UP * 3.9)
        transaction = self.data_row("TX 0842", "TRANSFER $100", ACID)
        transaction.move_to(UP * 0.8)
        database = self.database("PRIMARY DATA").move_to(DOWN * 2.45)
        down_arrow = self.sharp_arrow(transaction.get_bottom(), database.get_top(), INK)
        confirmed = self.stamp("ACKNOWLEDGED", ACID).move_to(DOWN * 5.55)

        self.play(GrowFromEdge(section, LEFT), run_time=0.16, rate_func=linear)
        self.play(AddTextLetterByLetter(commit), run_time=0.46, rate_func=linear)
        self.play(
            GrowFromEdge(transaction, LEFT),
            Create(down_arrow),
            run_time=0.34,
            rate_func=linear,
        )
        self.play(Create(database), run_time=0.28, rate_func=linear)
        self.play(GrowFromCenter(confirmed), run_time=0.18, rate_func=linear)
        self.wait(1.78)

        # 3.2-6.4s | "Then the power dies before the data reaches disk."
        blackout = Rectangle(
            width=9,
            height=16,
            stroke_width=0,
            fill_color=RED,
            fill_opacity=1,
        )
        crash_label = self.headline("POWER / LOST", 72, color=INK)
        crash_label.move_to(UP * 3.9)
        crash_code = self.mono("ERR 0x00", 28, RED).move_to(DOWN * 5.7)

        self.play(GrowFromEdge(blackout, LEFT), run_time=0.08, rate_func=linear)
        self.play(FadeOut(blackout), run_time=0.08, rate_func=linear)
        self.play(
            ReplacementTransform(commit, crash_label),
            database.animate.set_stroke(RED).set_opacity(0.28),
            FadeOut(transaction),
            FadeOut(down_arrow),
            FadeOut(confirmed),
            Transform(section, self.section_label("02 / THE FAILURE")),
            run_time=0.32,
            rate_func=linear,
        )
        self.play(Create(crash_code), run_time=0.16, rate_func=linear)
        self.wait(2.56)

        # 6.4-8.7s | "So why isn't the transaction lost?"
        question = self.headline("WHY ISN'T\nIT LOST?", 76)
        question.move_to(UP * 1.2)
        rule = self.mono("DURABILITY REQUIRES AN ORDER", 25, GRAY)
        rule.move_to(DOWN * 2.2)
        underline = self.rough_line(LEFT * 3.05, RIGHT * 3.05, ACID, width=5)
        underline.next_to(question, DOWN, buff=0.45)

        self.play(
            FadeOut(crash_label),
            FadeOut(crash_code),
            FadeOut(database),
            Transform(section, self.section_label("03 / THE QUESTION")),
            run_time=0.2,
            rate_func=linear,
        )
        self.play(AddTextLetterByLetter(question), run_time=0.45, rate_func=linear)
        self.play(Create(underline), FadeIn(rule), run_time=0.2, rate_func=linear)
        self.wait(1.45)

        # 8.7-14.4s | "Before acknowledging ... durable write-ahead log."
        self.play(
            FadeOut(question),
            FadeOut(underline),
            FadeOut(rule),
            Transform(section, self.section_label("04 / WRITE AHEAD")),
            run_time=0.2,
            rate_func=linear,
        )
        rule_title = self.headline("LOG FIRST.", 78).move_to(UP * 5.2)
        memory = self.data_row("MEM", "CHANGE: -$100", INK).move_to(UP * 2.5)
        wal = self.log().move_to(DOWN * 0.15)
        disk = self.database("PRIMARY DATA").move_to(DOWN * 3.65)
        first = self.step_tag("01", "FLUSH WAL", ACID).move_to(LEFT * 2.55 + UP * 1.42)
        later = self.step_tag("02", "WRITE LATER", GRAY).move_to(LEFT * 2.35 + DOWN * 1.92)
        arrow_one = self.sharp_arrow(memory.get_bottom(), wal.get_top(), ACID)
        arrow_two = self.sharp_arrow(wal.get_bottom(), disk.get_top(), GRAY)

        self.play(AddTextLetterByLetter(rule_title), run_time=0.35, rate_func=linear)
        self.play(GrowFromEdge(memory, LEFT), run_time=0.25, rate_func=linear)
        self.play(
            Create(arrow_one),
            GrowFromEdge(wal, LEFT),
            FadeIn(first),
            run_time=0.3,
            rate_func=linear,
        )
        self.play(
            Create(arrow_two),
            Create(disk),
            FadeIn(later),
            run_time=0.3,
            rate_func=linear,
        )
        self.play(wal[4].animate.set_fill(ACID, opacity=1), run_time=0.12, rate_func=linear)
        self.wait(4.18)

        # 14.4-17.7s | "After a crash, it replays that log and restores the data."
        replay_title = self.headline("REPLAY.", 82).move_to(UP * 5.2)
        replay_tag = self.step_tag("03", "RECOVER", ACID).move_to(LEFT * 2.65 + DOWN * 1.8)
        replay_arrow = self.sharp_arrow(wal.get_bottom(), disk.get_top(), ACID)

        self.play(
            ReplacementTransform(rule_title, replay_title),
            FadeOut(memory),
            FadeOut(first),
            FadeOut(later),
            FadeOut(arrow_one),
            FadeOut(arrow_two),
            wal.animate.move_to(UP * 1.5),
            disk.animate.move_to(DOWN * 2.3),
            Transform(section, self.section_label("05 / RECOVERY")),
            run_time=0.3,
            rate_func=linear,
        )
        replay_arrow = self.sharp_arrow(wal.get_bottom(), disk.get_top(), ACID)
        replay_tag.move_to(LEFT * 2.65 + DOWN * 0.25)
        self.play(Create(replay_arrow), FadeIn(replay_tag), run_time=0.3, rate_func=linear)
        self.play(
            disk[0].animate.set_stroke(ACID, width=4),
            disk[1].animate.set_color(ACID),
            disk[2].animate.set_color(ACID),
            run_time=0.16,
            rate_func=linear,
        )
        restored = self.stamp("RESTORED", ACID).move_to(DOWN * 5.45)
        self.play(GrowFromCenter(restored), run_time=0.16, rate_func=linear)
        self.wait(2.38)

        # 17.7-20.0s | "Record first. Apply later."
        self.play(
            *[FadeOut(mob) for mob in list(self.mobjects) if mob is not section],
            Transform(section, self.section_label("06 / SUMMARY")),
            run_time=0.2,
            rate_func=linear,
        )
        wal_word = self.headline("WAL", 150, color=ACID).move_to(UP * 1.25)
        final_rule = self.mono("RECORD FIRST.\nAPPLY LATER.", 42, INK)
        final_rule.set_line_spacing(1.15).move_to(DOWN * 1.3)
        bar = Rectangle(
            width=6.4,
            height=0.12,
            stroke_width=0,
            fill_color=ACID,
            fill_opacity=1,
        ).next_to(wal_word, DOWN, buff=0.35)
        self.play(GrowFromEdge(wal_word, LEFT), run_time=0.25, rate_func=linear)
        self.play(GrowFromEdge(bar, LEFT), run_time=0.12, rate_func=linear)
        self.play(AddTextLetterByLetter(final_rule), run_time=0.35, rate_func=linear)
        self.wait(1.38)

    def editorial_frame(self):
        top = Line(LEFT * 3.85, RIGHT * 3.85, color=DARK_GRAY, stroke_width=2)
        top.move_to(UP * 7.25)
        bottom = top.copy().move_to(DOWN * 7.25)
        left_mark = self.mono("DB/INTERNALS", 18, GRAY).move_to(LEFT * 3.05 + DOWN * 7.55)
        right_mark = self.mono("9:16 / 020S", 18, GRAY).move_to(RIGHT * 3.05 + DOWN * 7.55)
        return VGroup(top, bottom, left_mark, right_mark)

    def section_label(self, text):
        label = self.mono(text, 21, ACID)
        label.move_to(LEFT * 2.75 + UP * 7.58)
        return label

    def headline(self, text, size, color=INK):
        return Text(text, font=FONT, font_size=size, color=color, weight=BOLD)

    def mono(self, text, size, color=INK):
        return Text(text, font=FONT, font_size=size, color=color)

    def data_row(self, key, value, accent):
        box = self.rough_box(7, 1.25, accent, fill_color="#050505", fill_opacity=1)
        divider = self.rough_line(DOWN * 0.625, UP * 0.625, accent)
        divider.move_to(box.get_center() + LEFT * 2.15)
        key_text = self.mono(key, 24, accent).move_to(box.get_center() + LEFT * 2.75)
        value_text = self.mono(value, 28, INK).move_to(box.get_center() + RIGHT * 0.65)
        return VGroup(box, divider, key_text, value_text)

    def database(self, label):
        box = self.rough_box(4.6, 2.2, INK, fill_color="#050505", fill_opacity=1)
        line_one = self.rough_line(LEFT * 1.85, RIGHT * 1.85, GRAY, width=2)
        line_one.move_to(box.get_center() + UP * 0.48)
        line_two = line_one.copy().move_to(box.get_center() + DOWN * 0.48)
        text = self.mono(label, 24, INK).move_to(box)
        return VGroup(box, line_one, line_two, text)

    def log(self):
        box = self.rough_box(6.1, 2.15, ACID, fill_color="#050505", fill_opacity=1)
        title = self.mono("WAL / DURABLE LOG", 26, ACID)
        title.move_to(box.get_center() + UP * 0.62)
        entries = VGroup(
            *[
                self.rough_box(
                    1.45,
                    0.48,
                    ACID,
                    width=2,
                    fill_color=DARK_GRAY,
                    fill_opacity=1,
                )
                for _ in range(3)
            ]
        ).arrange(RIGHT, buff=0.2)
        entries.move_to(box.get_center() + DOWN * 0.38)
        return VGroup(box, title, entries[0], entries[1], entries[2])

    def step_tag(self, number, label, color):
        number_text = self.headline(number, 27, color)
        label_text = self.mono(label, 20, color)
        return VGroup(number_text, label_text).arrange(RIGHT, buff=0.18)

    def stamp(self, text, color):
        box = self.rough_box(
            4.2,
            0.85,
            color,
            width=2,
            fill_color=color,
            fill_opacity=1,
        )
        label = self.headline(text, 25, "#050505")
        return VGroup(box, label)

    @staticmethod
    def rough_box(
        box_width,
        box_height,
        color,
        width=3,
        fill_color="#050505",
        fill_opacity=0,
    ):
        fill = Rectangle(
            width=box_width,
            height=box_height,
            stroke_width=0,
            fill_color=fill_color,
            fill_opacity=fill_opacity,
        )
        corners = [
            np.array([-box_width / 2, -box_height / 2, 0]),
            np.array([box_width / 2, -box_height / 2, 0]),
            np.array([box_width / 2, box_height / 2, 0]),
            np.array([-box_width / 2, box_height / 2, 0]),
        ]
        strokes = []
        for pass_index, amplitude in enumerate((0.035, 0.02)):
            points = []
            for edge_index in range(4):
                start = corners[edge_index]
                end = corners[(edge_index + 1) % 4]
                direction = end - start
                normal = np.array([-direction[1], direction[0], 0])
                normal /= np.linalg.norm(normal)
                for sample in range(6):
                    t = sample / 6
                    wobble = amplitude * np.sin((sample + edge_index * 2 + pass_index) * 1.9)
                    points.append(start + direction * t + normal * wobble)
            points.append(points[0])
            stroke = VMobject().set_points_as_corners(points)
            stroke.set_stroke(color, width=width if pass_index == 0 else 1.2, opacity=0.9)
            strokes.append(stroke)
        return VGroup(fill, *strokes)

    @staticmethod
    def rough_line(start, end, color, width=3):
        direction = end - start
        normal = np.array([-direction[1], direction[0], 0])
        normal /= np.linalg.norm(normal)
        strokes = []
        for pass_index, amplitude in enumerate((0.025, -0.018)):
            points = [
                start,
                start + direction * 0.28 + normal * amplitude,
                start + direction * 0.62 - normal * amplitude * 0.7,
                end,
            ]
            stroke = VMobject().set_points_as_corners(points)
            stroke.set_stroke(color, width=width if pass_index == 0 else 1, opacity=0.9)
            strokes.append(stroke)
        return VGroup(*strokes)

    @staticmethod
    def sharp_arrow(start, end, color):
        direction = end - start
        unit = direction / np.linalg.norm(direction)
        normal = np.array([-unit[1], unit[0], 0])
        shaft_start = start + unit * 0.24
        tip = end - unit * 0.24
        shaft_end = tip - unit * 0.12
        shaft = WALShort.rough_line(shaft_start, shaft_end, color, width=3)
        left_wing = WALShort.rough_line(tip, tip - unit * 0.3 + normal * 0.18, color, width=3)
        right_wing = WALShort.rough_line(tip, tip - unit * 0.3 - normal * 0.18, color, width=3)
        return VGroup(shaft, left_wing, right_wing)
